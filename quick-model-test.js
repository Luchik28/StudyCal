const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

async function quickModelTest() {
    try {
        console.log('Starting quick model test...');
        
        // Set a timeout for the entire operation
        const timeoutId = setTimeout(() => {
            console.log('Model loading timed out after 10 seconds');
            process.exit(1);
        }, 10000);
        
        console.log('TensorFlow.js version:', tf.version.tfjs);
        
        // Try to load the model
        const modelUrl = `file://${path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json')}`;
        console.log('Loading model from:', modelUrl);
        
        const model = await tf.loadLayersModel(modelUrl);
        
        clearTimeout(timeoutId);
        console.log('Model loaded successfully!');
        console.log('Model summary:');
        model.summary();
        
        // Try a simple prediction
        console.log('\nTesting prediction...');
        const nameInput = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], [1, 15], 'int32');
        const startTimeInput = tf.tensor2d([[9, 0, 1, 15]], [1, 4], 'float32');
        const endTimeInput = tf.tensor2d([[10, 0, 1, 15]], [1, 4], 'float32');
        
        const prediction = model.predict({
            'name_input': nameInput,
            'start_time_input': startTimeInput,
            'end_time_input': endTimeInput
        });
        
        console.log('Prediction successful!');
        if (Array.isArray(prediction)) {
            console.log('Category prediction shape:', prediction[0].shape);
            console.log('Subcategory prediction shape:', prediction[1].shape);
        } else {
            console.log('Prediction shape:', prediction.shape);
        }
        
        // Clean up
        nameInput.dispose();
        startTimeInput.dispose();
        endTimeInput.dispose();
        if (Array.isArray(prediction)) {
            prediction.forEach(p => p.dispose());
        } else {
            prediction.dispose();
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

quickModelTest();
