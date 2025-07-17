// taskTimePrediction.ts
import * as tf from '@tensorflow/tfjs';

// --- IMPORTANT: THESE MUST MATCH YOUR PYTHON SCRIPT'S CONSTANTS ---
const OUTPUT_SEQUENCE_LENGTH = 50;
// const MAX_TOKENS = 20000; // Removed: unused
const OOV_TOKEN_ID = 1;

// --- NEW CONSTANT: MATCHES PYTHON TRAINING BATCH_SIZE ---
// This ensures your JavaScript input tensor's batch dimension matches the model's expectation.
const MODEL_EXPECTED_BATCH_SIZE = 32;

// Loads the time prediction model and vocabulary from public folder
export async function loadTimePredictionModel() {
  const modelPath = '/time_of_task_prediction_model/model.json'; // Path based on your Python export
  // console.log(`[AI DEBUG] Attempting to load model from: ${modelPath}`);

  let model: tf.GraphModel;
  try {
      // We use loadGraphModel as loadLayersModel encountered config format errors.
      model = await tf.loadGraphModel(modelPath);
      // console.log("[AI DEBUG] Model loaded successfully as GraphModel!");
  } catch (err) {
      // console.error(`[AI DEBUG] FATAL ERROR: Failed to load model as GraphModel from ${modelPath}. Details:`, err);
      throw new Error(`Failed to load TensorFlow.js model: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Load the vocabulary file
  const vocabResponse = await fetch('/model_vocabulary.json');
  const vocab = await vocabResponse.json();

  // Build a Map for fast word-to-index lookup
  const currentVocabMap = new Map<string, number>();
  (vocab as string[]).forEach((word: string, idx: number) => currentVocabMap.set(word, idx));

  // Log model and vocabulary details for debugging in the browser console
  // Debug logs removed
  
  // Return the loaded model and the vocabulary map
  return { model, vocabMap: currentVocabMap };
}

// Preprocesses a single task name into a TensorFlow.js tensor
// This function now explicitly takes the vocabMap as an argument.
export function preprocessTaskName(taskName: string, vocabMap: Map<string, number>): tf.Tensor2D {
  // 1. Tokenize: Convert to lowercase and split by whitespace
  const tokens = (taskName || '').toLowerCase().split(/\s+/).filter(Boolean);

  // 2. Convert words to integer IDs using the provided vocabMap.
  // Words not found in the vocabulary get assigned the OOV_TOKEN_ID (Out-Of-Vocabulary).
  let indices = tokens.map(token => vocabMap.has(token) ? vocabMap.get(token)! : OOV_TOKEN_ID);

  // 3. Pad or truncate the sequence to the fixed OUTPUT_SEQUENCE_LENGTH.
  if (indices.length > OUTPUT_SEQUENCE_LENGTH) {
    indices = indices.slice(0, OUTPUT_SEQUENCE_LENGTH); // Truncate from the end if too long
  } else if (indices.length < OUTPUT_SEQUENCE_LENGTH) {
    // Pad with zeros at the end to match the required length, consistent with Keras TextVectorization.
    indices = indices.concat(Array(OUTPUT_SEQUENCE_LENGTH - indices.length).fill(0));
  }

  // Return a 2D tensor of shape [1, OUTPUT_SEQUENCE_LENGTH] and type 'int32'.
  // The '1' signifies a batch size of one for this single input.
  return tf.tensor2d([indices], [1, OUTPUT_SEQUENCE_LENGTH], 'int32');
}

// Predicts the task duration in minutes given the loaded model, vocabulary map, and a task name.
export async function predictTaskDuration(
  model: tf.GraphModel, // The loaded TensorFlow.js GraphModel
  vocabMap: Map<string, number>, // The vocabulary map for text preprocessing
  taskName: string // The input task title (string)
): Promise<number> {
  // 1. Preprocess the single task name into an 'int32' tensor of shape [1, 50]
  const singleInputTensor = preprocessTaskName(taskName, vocabMap);

  // 2. Pad the input tensor to match the model's expected batch size.
  // The model was likely exported with a fixed batch size from Python.
  let finalInputTensor: tf.Tensor2D;
  if (MODEL_EXPECTED_BATCH_SIZE > 1) {
      const remainingBatchSize = MODEL_EXPECTED_BATCH_SIZE - 1;
      // Create a tensor of zeros to fill the rest of the batch.
      // Explicitly casting to Tensor2D to satisfy TypeScript's type checking.
      const paddingTensor = tf.zeros([remainingBatchSize, OUTPUT_SEQUENCE_LENGTH], 'int32') as tf.Tensor2D;
      // Concatenate the real input with the padding tensor along the batch dimension (axis 0).
      finalInputTensor = singleInputTensor.concat(paddingTensor, 0);
      paddingTensor.dispose(); // Dispose the temporary padding tensor to free up memory.
  } else {
      // If the model expects a batch size of 1, no padding is needed.
      finalInputTensor = singleInputTensor;
  }

  // 3. CRITICAL FIX: Cast the input tensor from 'int32' to 'float32'.
  // The GraphModel's input signature often expects 'float32' even for integer indices.
  const inputForPrediction = finalInputTensor.asType('float32');

  // Log tensor details before prediction for debugging
  // Debug logs removed

  let predictionRaw: tf.Tensor | tf.Tensor[] | { [key: string]: tf.Tensor };
  try {
      // 4. Make the prediction using the model.
      // We use 'inputs' as the key for the input tensor, which is a common default for GraphModels.
      predictionRaw = model.predict({ 'inputs': inputForPrediction });
  } catch (predictError) {
      // console.error("[AI DEBUG] Prediction failed at model.predict() call:", predictError);
      // Ensure all created tensors are disposed in case of an error to prevent memory leaks.
      singleInputTensor.dispose();
      finalInputTensor.dispose();
      inputForPrediction.dispose();
      throw new Error(`Model prediction failed: ${predictError instanceof Error ? predictError.message : String(predictError)}`);
  }

  // 5. Extract the single prediction from the model's output.
  // Your Python model has a single output layer, so we expect a single output tensor.
  let outputTensor: tf.Tensor;
  if (predictionRaw instanceof tf.Tensor) {
      outputTensor = predictionRaw;
  } else if (Array.isArray(predictionRaw)) {
      outputTensor = predictionRaw[0]; // If an array of tensors is returned, take the first one.
  } else if (typeof predictionRaw === 'object' && predictionRaw !== null) {
      // If a named output object is returned (e.g., {'output_layer': tensor}), get its value.
      const values = Object.values(predictionRaw);
      if (values.length > 0) {
          outputTensor = values[0] as tf.Tensor;
      } else {
          throw new Error("Model prediction object had no outputs.");
      }
  } else {
      throw new Error("Unexpected model prediction output format.");
  }

  // Get the numerical data from the output tensor.
  // Since our actual input was the first item in the batch, we take the first prediction.
  const arr = await outputTensor.data();
  let duration = arr[0];

  // Round the predicted duration to the nearest whole number of minutes.
  // Round to the nearest 5 minutes
  duration = Math.round(duration / 5) * 5;

  // 6. Clean up all tensors to free up GPU/CPU memory.
  singleInputTensor.dispose(); // Dispose the original single input tensor
  finalInputTensor.dispose(); // Dispose the padded input tensor
  inputForPrediction.dispose(); // Dispose the 'float32' casted tensor
  outputTensor.dispose(); // Dispose the output tensor

  // Dispose any other tensors that might be part of predictionRaw if it was an array/object.
  if (Array.isArray(predictionRaw)) {
      (predictionRaw as tf.Tensor[]).filter(t => t !== outputTensor).forEach(t => t.dispose());
  } else if (typeof predictionRaw === 'object' && predictionRaw !== null && !(predictionRaw instanceof tf.Tensor)) {
      Object.values(predictionRaw).filter(t => t !== outputTensor).forEach(t => (t as tf.Tensor).dispose());
  }

  // Debug logs removed
  return duration;
}