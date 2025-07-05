// Test the TensorFlow model loading and classification
// This test can be run independently to debug issues

const tf = require('@tensorflow/tfjs-node');

console.log('Starting TensorFlow.js test...');
console.log('TensorFlow.js version:', tf.version.tfjs);

async function testModelLoading() {
  try {
    console.log('Testing model loading...');
    
    // Test loading the model (use file:// URL for Node.js)
    const path = require('path');
    const modelPath = 'file://' + path.join(__dirname, 'calendar_event_classification_model', 'model.json');
    console.log('Loading model from:', modelPath);
    
    const model = await tf.loadLayersModel(modelPath);
    
    console.log('Model loaded successfully!');
    console.log('Model inputs:', model.inputs.map(input => ({ 
      name: input.name, 
      shape: input.shape,
      dtype: input.dtype
    })));
    console.log('Model outputs:', model.outputs.map(output => ({ 
      name: output.name, 
      shape: output.shape,
      dtype: output.dtype
    })));
    
    // Test model prediction with correct input format
    console.log('Testing model prediction...');
    
    // Create test inputs in the correct format
    const testNameTensor = tf.zeros([1, 15], 'int32');
    const testStartTensor = tf.zeros([1, 4], 'float32');
    const testEndTensor = tf.zeros([1, 4], 'float32');
    
    // Test prediction with array format (current implementation)
    console.log('Testing with array input format...');
    const arrayPrediction = model.predict([testNameTensor, testStartTensor, testEndTensor]);
    console.log('Array prediction successful!');
    console.log('Category output shape:', arrayPrediction[0].shape);
    console.log('Subcategory output shape:', arrayPrediction[1].shape);
    
    // Test prediction with object format (alternative)
    console.log('Testing with object input format...');
    try {
      const objectPrediction = model.predict({
        'name_input': testNameTensor.clone(),
        'start_time_input': testStartTensor.clone(),
        'end_time_input': testEndTensor.clone()
      });
      console.log('Object prediction also successful!');
      console.log('Category output shape:', objectPrediction[0].shape);
      console.log('Subcategory output shape:', objectPrediction[1].shape);
      objectPrediction[0].dispose();
      objectPrediction[1].dispose();
    } catch (objError) {
      console.log('Object format failed:', objError);
    }
    
    // Clean up
    testNameTensor.dispose();
    testStartTensor.dispose();
    testEndTensor.dispose();
    arrayPrediction[0].dispose();
    arrayPrediction[1].dispose();
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error.stack);
  }
}

// Run the test
testModelLoading();
