import * as tf from '@tensorflow/tfjs';
import { Event } from '@/types/events';

// Category and subcategory mappings (must match Python training)
const categoryMap = {
  'Work': 0, 'Personal': 1, 'Social': 2, 'Health': 3, 'Education': 4, 'Travel': 5
};

const subcategoryMap = {
  'Activity': 0, 'Appointment': 1, 'Chore/Errand': 2, 'Class': 3, 'Event': 4,
  'Extra-Curricular': 5, 'Gathering': 6, 'Logistics': 7, 'Meeting': 8, 'Other': 9,
  'Social/Family': 10, 'Study Session': 11, 'Task/Project Work': 12, 'Test/Exam': 13, 'Trip': 14
};

const reverseCategoryMap = Object.keys(categoryMap).reduce((acc, key) => {
  acc[categoryMap[key as keyof typeof categoryMap]] = key;
  return acc;
}, {} as Record<number, string>);

const reverseSubcategoryMap = Object.keys(subcategoryMap).reduce((acc, key) => {
  acc[subcategoryMap[key as keyof typeof subcategoryMap]] = key;
  return acc;
}, {} as Record<number, string>);

const MAX_SEQUENCE_LENGTH = 15;

let model: tf.LayersModel | tf.GraphModel | null = null;
let wordIndex: Record<string, number> | null = null;
let isLoading = false;

// Function to preprocess text: tokenize and pad sequences
const preprocessText = (text: string, loadedWordIndex: Record<string, number>, maxLength: number): number[] => {
  let inputText = (text === null || text === undefined || typeof text !== 'string') ? '' : text;
  inputText = inputText.toLowerCase();

  // Regex to match words (alphanumeric sequences)
  const tokens = inputText.match(/\b\w+\b/g) || [];

  // Map tokens to their index using the loaded wordIndex
  const indexedTokens = tokens.map(token => {
    return loadedWordIndex[token] || 0;
  });

  // Create a TensorFlow tensor from indexed tokens
  const sequenceTensor = tf.tensor1d(indexedTokens, 'int32');

  // Pad or truncate sequences to MAX_SEQUENCE_LENGTH
  const paddedSequence = tf.pad(
    sequenceTensor,
    [[0, Math.max(0, maxLength - indexedTokens.length)]],
    0
  );

  // Get the array, ensuring it's exactly maxLength and disposing the tensor
  const finalPaddedArray = paddedSequence.arraySync().slice(0, maxLength) as number[];
  sequenceTensor.dispose();
  paddedSequence.dispose();
  return finalPaddedArray;
};

// Function to preprocess time string into numerical features
const preprocessTime = (timeString: string): number[] => {
  try {
    if (!timeString || typeof timeString !== 'string' || timeString.trim() === '') {
      return [0, 0, 0, 0];
    }

    const date = new Date();
    let hours, minutes;

    const upperTimeString = timeString.toUpperCase();

    if (upperTimeString.includes('AM') || upperTimeString.includes('PM')) {
      const parts = upperTimeString.match(/(\d{1,2})(:\d{2})?\s*(AM|PM)/);
      if (!parts) throw new Error("AM/PM time format mismatch");

      hours = parseInt(parts[1], 10);
      minutes = parts[2] ? parseInt(parts[2].substring(1), 10) : 0;

      const ampm = parts[3];
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

    } else if (timeString.includes(':')) {
      const [h, m] = timeString.split(':').map(Number);
      hours = h;
      minutes = m || 0;
    } else {
      hours = parseInt(timeString, 10);
      minutes = 0;
    }

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error("Parsed time is invalid or out of range");
    }

    date.setHours(hours, minutes, 0, 0);

    const hour = date.getHours();
    const isMorning = hour >= 6 && hour < 12 ? 1 : 0;
    const isAfternoon = hour >= 12 && hour < 18 ? 1 : 0;
    const isEvening = hour >= 18 || hour < 6 ? 1 : 0;

    const normalizedHour = hour / 23.0;

    return [normalizedHour, isMorning, isAfternoon, isEvening];
  } catch (error) {
    console.error("Error preprocessing time:", error);
    return [0, 0, 0, 0];
  }
};

// Function to format Date object to time string
const formatTimeForClassification = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Load model and word index
export const loadClassificationModel = async (): Promise<void> => {
  if (model && wordIndex) return; // Already loaded
  if (isLoading) return; // Already loading

  isLoading = true;
  try {
    console.log('Starting to load classification model and word index...');
    
    // Load the word_index.json file
    const wordIndexResponse = await fetch('/word_index.json');
    if (!wordIndexResponse.ok) {
      throw new Error(`Failed to load word index: HTTP ${wordIndexResponse.status}`);
    }
    const loadedWordIndex = await wordIndexResponse.json();
    wordIndex = loadedWordIndex;
    console.log('Word index loaded successfully!', Object.keys(wordIndex || {}).length, 'words');

    // Load the TensorFlow.js model with additional options
    console.log('Loading TensorFlow.js model...');
    
    // Ensure TensorFlow.js backend is ready
    await tf.ready();
    console.log('TensorFlow.js backend ready:', tf.getBackend());
    
    // Try loading the model with enhanced error handling
    let loadedModel;
    try {
      // First, try to fetch the model.json directly to check if it's accessible
      const cacheBuster = `?v=${Date.now()}`;
      const modelResponse = await fetch(`/tfjs_multi_output_model_v2/model.json${cacheBuster}`);
      if (!modelResponse.ok) {
        throw new Error(`Model file not accessible: HTTP ${modelResponse.status}`);
      }
      const modelData = await modelResponse.json();
      console.log('Model JSON loaded successfully, format:', modelData.format);
      
      // Load as graph model (not layers model)
      loadedModel = await tf.loadGraphModel(`/tfjs_multi_output_model_v2/model.json${cacheBuster}`);
      console.log('Model loaded successfully without options');
    } catch (error) {
      console.error('Failed to load model:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Model loading failed: ${errorMessage}`);
    }
    
    model = loadedModel;
    console.log('TensorFlow.js graph model loaded successfully!');
    
    // Test the model with a simple prediction to ensure it works
    const testInputs = {
      'inputs': tf.zeros([1, 15], 'int32'),
      'inputs_1': tf.zeros([1, 4], 'float32'),
      'inputs_2': tf.zeros([1, 4], 'float32')
    };
    
    try {
      // Test with object format for graph model
      const testPrediction = model.predict(testInputs) as {[key: string]: tf.Tensor};
      
      // Clean up test tensors
      Object.values(testInputs).forEach(tensor => tensor.dispose());
      Object.values(testPrediction).forEach(tensor => tensor.dispose());
    } catch (testError) {
      // Clean up test tensors even on error
      Object.values(testInputs).forEach(tensor => tensor.dispose());
      throw new Error(`Model test failed: ${testError}`);
    }
    
  } catch (error) {
    console.error('Failed to load classification assets:', error);
    // Reset loading state on error
    model = null;
    wordIndex = null;
    throw error;
  } finally {
    isLoading = false;
  }
};

// Classify a single event
export const classifyEvent = async (event: Event): Promise<{ category: string; subcategory: string; categoryConfidence: number; subcategoryConfidence: number }> => {
  if (!model || !wordIndex) {
    throw new Error('Model or vocabulary not loaded yet.');
  }

  // Preprocess input data
  const nameFeatures = preprocessText(event.title, wordIndex, MAX_SEQUENCE_LENGTH);
  const startTimeFeatures = preprocessTime(formatTimeForClassification(event.startTime));
  const endTimeFeatures = preprocessTime(formatTimeForClassification(event.endTime));

  // Create tensors
  const nameTensor = tf.tensor2d([nameFeatures], [1, MAX_SEQUENCE_LENGTH], 'int32');
  const startTimeTensor = tf.tensor2d([startTimeFeatures], [1, 4], 'float32');
  const endTimeTensor = tf.tensor2d([endTimeFeatures], [1, 4], 'float32');

  // Create input object for graph model
  const modelInputs = {
    'inputs': nameTensor,
    'inputs_1': startTimeTensor,
    'inputs_2': endTimeTensor
  };

  let predictions: {[key: string]: tf.Tensor} | null = null;
  try {
    // Make prediction using object format for graph model
    predictions = (model as tf.GraphModel).predict(modelInputs) as {[key: string]: tf.Tensor};

    // Determine which output is category (6 classes) vs subcategory (15 classes)
    const outputs = Object.values(predictions);
    const output0Shape = outputs[0].shape;
    const output1Shape = outputs[1].shape;
    
    let categoryOutput: tf.Tensor;
    let subcategoryOutput: tf.Tensor;
    
    if (output0Shape[1] === 6 && output1Shape[1] === 15) {
      // Output 0 is category (6), Output 1 is subcategory (15)
      categoryOutput = outputs[0];
      subcategoryOutput = outputs[1];
    } else if (output0Shape[1] === 15 && output1Shape[1] === 6) {
      // Output 0 is subcategory (15), Output 1 is category (6)
      categoryOutput = outputs[1];
      subcategoryOutput = outputs[0];
    } else {
      // Fallback: use outputs in order
      categoryOutput = outputs[0];
      subcategoryOutput = outputs[1];
    }

    // Extract category predictions
    const categoryPredictionArray = await categoryOutput.data();
    const categoryArray = Array.from(categoryPredictionArray) as number[];
    const predictedCategoryIndex = categoryArray.indexOf(Math.max(...categoryArray));
    const predictedCategory = reverseCategoryMap[predictedCategoryIndex];
    const categoryConfidence = Math.max(...categoryArray);

    // Extract subcategory predictions
    const subcategoryPredictionArray = await subcategoryOutput.data();
    const subcategoryArray = Array.from(subcategoryPredictionArray) as number[];
    const predictedSubcategoryIndex = subcategoryArray.indexOf(Math.max(...subcategoryArray));
    const predictedSubcategory = reverseSubcategoryMap[predictedSubcategoryIndex];
    const subcategoryConfidence = Math.max(...subcategoryArray);

    return {
      category: predictedCategory,
      subcategory: predictedSubcategory,
      categoryConfidence,
      subcategoryConfidence
    };

  } catch (error) {
    console.error("Error during prediction:", error);
    throw error;
  } finally {
    // Clean up tensors
    nameTensor.dispose();
    startTimeTensor.dispose();
    endTimeTensor.dispose();
    if (predictions) {
      Object.values(predictions).forEach(tensor => tensor.dispose());
    }
  }
};

// Classify all events in a list
export const classifyAllEvents = async (events: Event[]): Promise<Event[]> => {
  try {
    await loadClassificationModel();
    
    if (!model || !wordIndex) {
      console.warn('Model or wordIndex not loaded, returning events with fallback categories');
      return events.map(event => ({
        ...event,
        category: 'Personal',
        subcategory: 'Other'
      }));
    }
    
    const classifiedEvents = [];
    for (const event of events) {
      try {
        const classification = await classifyEvent(event);
        classifiedEvents.push({
          ...event,
          category: classification.category,
          subcategory: classification.subcategory
        });
      } catch (error) {
        console.error(`Failed to classify event ${event.id}:`, error);
        classifiedEvents.push({
          ...event,
          category: 'Personal',
          subcategory: 'Other'
        });
      }
    }
    
    return classifiedEvents;
  } catch (error) {
    console.error('Failed to load model for classification:', error);
    // Return events with fallback categories
    return events.map(event => ({
      ...event,
      category: 'Personal',
      subcategory: 'Other'
    }));
  }
};

export const isModelLoaded = (): boolean => {
  return model !== null && wordIndex !== null;
};
