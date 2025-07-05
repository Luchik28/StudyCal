// Simple test to check TensorFlow.js imports and basic functionality
console.log('Starting TensorFlow.js import test...');

try {
    console.log('1. Importing @tensorflow/tfjs-node...');
    const tf = require('@tensorflow/tfjs-node');
    
    console.log('2. TensorFlow.js version:', tf.version);
    console.log('3. TensorFlow.js imported successfully');
    
    console.log('4. Testing basic tensor creation...');
    const tensor = tf.tensor([1, 2, 3, 4]);
    console.log('5. Tensor created:', tensor.shape);
    tensor.dispose();
    
    console.log('6. Testing model creation...');
    const input = tf.input({shape: [4]});
    const dense = tf.layers.dense({units: 1}).apply(input);
    const model = tf.model({inputs: input, outputs: dense});
    console.log('7. Model created successfully');
    
    console.log('8. Testing model prediction...');
    const testInput = tf.tensor2d([[1, 2, 3, 4]]);
    const prediction = model.predict(testInput);
    console.log('9. Prediction shape:', prediction.shape);
    
    // Clean up
    testInput.dispose();
    prediction.dispose();
    model.dispose();
    
    console.log('10. All tests passed successfully!');
    
} catch (error) {
    console.error('Error during TensorFlow.js test:', error.message);
    console.error('Stack:', error.stack);
}

console.log('Test completed.');
