const tf = require('@tensorflow/tfjs-node');

async function testManualModelCreation() {
    console.log('=== TESTING MANUAL MODEL CREATION ===');
    
    try {
        console.log('1. Creating inputs...');
        const nameInput = tf.input({shape: [15], name: 'name_input', dtype: 'int32'});
        const startTimeInput = tf.input({shape: [4], name: 'start_time_input', dtype: 'float32'});
        const endTimeInput = tf.input({shape: [4], name: 'end_time_input', dtype: 'float32'});
        console.log('   Inputs created successfully');
        
        console.log('2. Creating embedding layer...');
        const embedding = tf.layers.embedding({
            inputDim: 9607, // From the original model
            outputDim: 100,
            name: 'text_embedding'
        });
        const embeddedName = embedding.apply(nameInput);
        console.log('   Embedding layer created successfully');
        
        console.log('3. Creating flatten layer...');
        const flattened = tf.layers.flatten({name: 'flattened_name'}).apply(embeddedName);
        console.log('   Flatten layer created successfully');
        
        console.log('4. Creating concatenate layer...');
        const concatenated = tf.layers.concatenate({
            name: 'concatenated_features_layer'
        }).apply([flattened, startTimeInput, endTimeInput]);
        console.log('   Concatenate layer created successfully');
        
        console.log('5. Creating dense layers...');
        const dense1 = tf.layers.dense({
            units: 128,
            activation: 'relu',
            name: 'shared_dense_1'
        }).apply(concatenated);
        
        const dropout1 = tf.layers.dropout({
            rate: 0.3,
            name: 'shared_dropout_1'
        }).apply(dense1);
        
        const dense2 = tf.layers.dense({
            units: 64,
            activation: 'relu',
            name: 'shared_dense_2'
        }).apply(dropout1);
        
        const dropout2 = tf.layers.dropout({
            rate: 0.3,
            name: 'shared_dropout_2'
        }).apply(dense2);
        console.log('   Dense and dropout layers created successfully');
        
        console.log('6. Creating output layers...');
        const categoryOutput = tf.layers.dense({
            units: 5,
            activation: 'softmax',
            name: 'category_output'
        }).apply(dropout2);
        
        const subcategoryOutput = tf.layers.dense({
            units: 10,
            activation: 'softmax',
            name: 'subcategory_output'
        }).apply(dropout2);
        console.log('   Output layers created successfully');
        
        console.log('7. Creating model...');
        const model = tf.model({
            inputs: [nameInput, startTimeInput, endTimeInput],
            outputs: [categoryOutput, subcategoryOutput],
            name: 'calendar_event_classification_model'
        });
        console.log('   Model created successfully!');
        
        console.log('8. Model summary:');
        model.summary();
        
        console.log('9. Testing prediction...');
        const testNameInput = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], [1, 15], 'int32');
        const testStartTimeInput = tf.tensor2d([[9, 0, 1, 15]], [1, 4], 'float32');
        const testEndTimeInput = tf.tensor2d([[10, 0, 1, 15]], [1, 4], 'float32');
        
        const prediction = model.predict([testNameInput, testStartTimeInput, testEndTimeInput]);
        
        console.log('   Prediction successful!');
        console.log('   Category prediction shape:', prediction[0].shape);
        console.log('   Subcategory prediction shape:', prediction[1].shape);
        
        // Clean up
        testNameInput.dispose();
        testStartTimeInput.dispose();
        testEndTimeInput.dispose();
        prediction[0].dispose();
        prediction[1].dispose();
        model.dispose();
        
        console.log('SUCCESS: Manual model works perfectly!');
        
        // Now try to save and reload this model
        console.log('\n10. Testing save and reload...');
        const newModel = tf.model({
            inputs: [nameInput, startTimeInput, endTimeInput],
            outputs: [categoryOutput, subcategoryOutput],
            name: 'test_model'
        });
        
        const tempModelPath = './temp_model';
        await newModel.save(`file://${tempModelPath}`);
        console.log('   Model saved successfully');
        
        const reloadedModel = await tf.loadLayersModel(`file://${tempModelPath}/model.json`);
        console.log('   Model reloaded successfully!');
        
        reloadedModel.summary();
        reloadedModel.dispose();
        newModel.dispose();
        
    } catch (error) {
        console.error('ERROR:', error.message);
        console.error('STACK:', error.stack);
    }
}

testManualModelCreation();
