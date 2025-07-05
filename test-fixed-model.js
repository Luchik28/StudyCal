const tf = require('@tensorflow/tfjs-node');
const path = require('path');

async function testModelDirectly() {
    console.log('=== TESTING FIXED MODEL ===');
    
    try {
        console.log('TensorFlow.js version:', tf.version.tfjs);
        
        // Load the fixed model
        const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
        const modelUrl = `file://${modelPath}`;
        
        console.log('Loading model from:', modelUrl);
        
        const model = await tf.loadLayersModel(modelUrl);
        console.log('✅ Model loaded successfully!');
        
        console.log('\nModel Summary:');
        model.summary();
        
        // Test prediction with sample data
        console.log('\n🧪 Testing prediction...');
        
        const nameInput = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], [1, 15], 'int32');
        const startTimeInput = tf.tensor2d([[14.0, 0, 1, 0]], [1, 4], 'float32'); // 2 PM
        const endTimeInput = tf.tensor2d([[15.0, 0, 1, 0]], [1, 4], 'float32');   // 3 PM
        
        const prediction = model.predict([nameInput, startTimeInput, endTimeInput]);
        
        console.log('✅ Prediction successful!');
        
        if (Array.isArray(prediction)) {
            console.log('Category prediction shape:', prediction[0].shape);
            console.log('Subcategory prediction shape:', prediction[1].shape);
            
            const categoryProbs = await prediction[0].data();
            const subcategoryProbs = await prediction[1].data();
            
            console.log('\nCategory probabilities:', Array.from(categoryProbs).map(p => p.toFixed(4)));
            console.log('Subcategory probabilities:', Array.from(subcategoryProbs).map(p => p.toFixed(4)));
            
            // Find the most likely predictions
            const categoryIndex = Array.from(categoryProbs).indexOf(Math.max(...categoryProbs));
            const subcategoryIndex = Array.from(subcategoryProbs).indexOf(Math.max(...subcategoryProbs));
            
            console.log('\n🎯 Predicted category index:', categoryIndex);
            console.log('🎯 Predicted subcategory index:', subcategoryIndex);
            
            prediction[0].dispose();
            prediction[1].dispose();
        }
        
        // Clean up
        nameInput.dispose();
        startTimeInput.dispose();
        endTimeInput.dispose();
        model.dispose();
        
        console.log('\n🎉 SUCCESS: Model test completed!');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testModelDirectly();
