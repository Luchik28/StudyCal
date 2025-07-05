// Test script to verify TensorFlow.js model loading
import * as tf from '@tensorflow/tfjs';

async function testModelLoading() {
  try {
    console.log('Testing TensorFlow.js model loading...');
    
    // Set TensorFlow.js backend to CPU for Node.js
    await tf.setBackend('cpu');
    await tf.ready();
    console.log('TensorFlow.js backend ready:', tf.getBackend());
    
    // Load the model
    console.log('Loading model...');
    const model = await tf.loadLayersModel('file://./public/calendar_event_classification_model/model.json');
    console.log('Model loaded successfully!');
    
    // Print model info
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
    
    // Test prediction with dummy data
    console.log('Testing prediction...');
    const testNameTensor = tf.zeros([1, 15], 'int32');
    const testStartTensor = tf.zeros([1, 4], 'float32');
    const testEndTensor = tf.zeros([1, 4], 'float32');
    
    const prediction = model.predict({
      'name_input': testNameTensor,
      'start_time_input': testStartTensor,
      'end_time_input': testEndTensor
    });
    
    console.log('Prediction successful!');
    console.log('Category output shape:', prediction[0].shape);
    console.log('Subcategory output shape:', prediction[1].shape);
    
    // Clean up
    testNameTensor.dispose();
    testStartTensor.dispose();
    testEndTensor.dispose();
    prediction[0].dispose();
    prediction[1].dispose();
    
    console.log('✅ Model loading test passed!');
    
  } catch (error) {
    console.error('❌ Model loading test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testModelLoading();
