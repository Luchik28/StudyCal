const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

async function testModelWithTimeout() {
    console.log('Starting model loading test with timeout...');
    console.log('TensorFlow.js version:', tf.version.tfjs);
    
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelUrl = `file://${modelPath}`;
    
    console.log('Model URL:', modelUrl);
    console.log('Model file exists:', fs.existsSync(modelPath));
    
    // Set a timeout to prevent infinite hanging
    const timeouts = [5000, 10000, 15000]; // 5s, 10s, 15s
    
    for (const timeout of timeouts) {
        console.log(`\n--- Attempting to load model with ${timeout/1000}s timeout ---`);
        
        try {
            const loadPromise = tf.loadLayersModel(modelUrl);
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Model loading timed out after ${timeout/1000} seconds`));
                }, timeout);
            });
            
            const model = await Promise.race([loadPromise, timeoutPromise]);
            
            console.log('✅ Model loaded successfully!');
            console.log('Model input shape:', model.inputs.map(input => input.shape));
            console.log('Model output shape:', model.outputs.map(output => output.shape));
            return;
            
        } catch (error) {
            if (error.message.includes('timed out')) {
                console.log(`❌ Model loading timed out after ${timeout/1000}s`);
                continue;
            } else {
                console.log(`❌ Model loading failed with error: ${error.message}`);
                console.log('Error stack:', error.stack);
                break;
            }
        }
    }
    
    console.log('\n--- All timeout attempts failed ---');
    console.log('The model appears to be stuck in an infinite loop or has a serious compatibility issue.');
}

// Add process monitoring
let memUsage = process.memoryUsage();
console.log('Initial memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
});

const memoryMonitor = setInterval(() => {
    memUsage = process.memoryUsage();
    console.log('Memory usage:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
    });
}, 2000); // Every 2 seconds

testModelWithTimeout().finally(() => {
    clearInterval(memoryMonitor);
    console.log('Test completed.');
});
