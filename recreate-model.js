const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

async function recreateModelWithOriginalWeights() {
    console.log('=== RECREATING MODEL WITH ORIGINAL WEIGHTS ===');
    
    try {
        // Step 1: Read the original model to get the exact architecture parameters
        console.log('1. Reading original model metadata...');
        const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
        const originalModelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
        
        const layers = originalModelJson.modelTopology.model_config.config.layers;
        
        // Extract parameters from the original model
        const embeddingLayer = layers.find(l => l.class_name === 'Embedding');
        const inputDim = embeddingLayer.config.input_dim;
        const outputDim = embeddingLayer.config.output_dim;
        
        console.log(`   Embedding parameters: inputDim=${inputDim}, outputDim=${outputDim}`);
        
        // Step 2: Create the model manually with exact architecture
        console.log('2. Creating model manually...');
        
        const nameInput = tf.input({shape: [15], name: 'name_input', dtype: 'int32'});
        const startTimeInput = tf.input({shape: [4], name: 'start_time_input', dtype: 'float32'});
        const endTimeInput = tf.input({shape: [4], name: 'end_time_input', dtype: 'float32'});
        
        const embedding = tf.layers.embedding({
            inputDim: inputDim,
            outputDim: outputDim,
            name: 'text_embedding'
        });
        const embeddedName = embedding.apply(nameInput);
        
        const flattened = tf.layers.flatten({name: 'flattened_name'}).apply(embeddedName);
        
        const concatenated = tf.layers.concatenate({
            name: 'concatenated_features_layer'
        }).apply([flattened, startTimeInput, endTimeInput]);
        
        // Get dense layer parameters from original model
        const dense1Layer = layers.find(l => l.name === 'shared_dense_1');
        const dense2Layer = layers.find(l => l.name === 'shared_dense_2');
        const categoryLayer = layers.find(l => l.name === 'category_output');
        const subcategoryLayer = layers.find(l => l.name === 'subcategory_output');
        
        const dense1 = tf.layers.dense({
            units: dense1Layer.config.units,
            activation: dense1Layer.config.activation,
            name: 'shared_dense_1'
        }).apply(concatenated);
        
        // Note: Dropout layers during inference don't need exact rate matching
        const dropout1 = tf.layers.dropout({
            rate: 0.3,
            name: 'shared_dropout_1'
        }).apply(dense1);
        
        const dense2 = tf.layers.dense({
            units: dense2Layer.config.units,
            activation: dense2Layer.config.activation,
            name: 'shared_dense_2'
        }).apply(dropout1);
        
        const dropout2 = tf.layers.dropout({
            rate: 0.3,
            name: 'shared_dropout_2'
        }).apply(dense2);
        
        const categoryOutput = tf.layers.dense({
            units: categoryLayer.config.units,
            activation: categoryLayer.config.activation,
            name: 'category_output'
        }).apply(dropout2);
        
        const subcategoryOutput = tf.layers.dense({
            units: subcategoryLayer.config.units,
            activation: subcategoryLayer.config.activation,
            name: 'subcategory_output'
        }).apply(dropout2);
        
        const newModel = tf.model({
            inputs: [nameInput, startTimeInput, endTimeInput],
            outputs: [categoryOutput, subcategoryOutput],
            name: 'recreated_model'
        });
        
        console.log('   Model recreated successfully!');
        newModel.summary();
        
        // Step 3: Try to load weights from the original model
        console.log('\n3. Attempting to load original weights...');
        
        // For now, let's just test if the recreated model works with random weights
        console.log('4. Testing recreated model with random weights...');
        const testNameInput = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], [1, 15], 'int32');
        const testStartTimeInput = tf.tensor2d([[9, 0, 1, 15]], [1, 4], 'float32');
        const testEndTimeInput = tf.tensor2d([[10, 0, 1, 15]], [1, 4], 'float32');
        
        const prediction = newModel.predict([testNameInput, testStartTimeInput, testEndTimeInput]);
        
        console.log('   Prediction successful!');
        console.log('   Category prediction shape:', prediction[0].shape);
        console.log('   Subcategory prediction shape:', prediction[1].shape);
        
        // Get actual prediction values
        const categoryProbs = await prediction[0].data();
        const subcategoryProbs = await prediction[1].data();
        
        console.log('   Category probabilities:', Array.from(categoryProbs));
        console.log('   Subcategory probabilities:', Array.from(subcategoryProbs));
        
        // Clean up
        testNameInput.dispose();
        testStartTimeInput.dispose();
        testEndTimeInput.dispose();
        prediction[0].dispose();
        prediction[1].dispose();
        
        // Step 4: Save the working model
        console.log('\n5. Saving working model...');
        const workingModelPath = './working_model';
        await newModel.save(`file://${workingModelPath}`);
        console.log('   Working model saved successfully!');
        
        // Step 5: Test reload
        console.log('\n6. Testing reload of working model...');
        const reloadedModel = await tf.loadLayersModel(`file://${workingModelPath}/model.json`);
        console.log('   Working model reloaded successfully!');
        
        reloadedModel.dispose();
        newModel.dispose();
        
        console.log('\nSUCCESS: We have a working model architecture!');
        console.log('Next step would be to extract and load the original trained weights.');
        
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error('STACK:', error.stack);
    }
}

recreateModelWithOriginalWeights();
