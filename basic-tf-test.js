const tf = require('@tensorflow/tfjs-node');

async function runTests() {
    console.log('=== BASIC TENSORFLOW.JS TEST ===');
    console.log('TensorFlow.js version:', tf.version.tfjs);

    // Test 1: Basic tensor operations
    console.log('\n1. Testing basic tensor operations...');
    try {
        const a = tf.tensor([1, 2, 3, 4]);
        const b = tf.tensor([2, 3, 4, 5]);
        const result = a.add(b);
        console.log('   Basic operations: OK');
        console.log('   Result:', await result.data());
        a.dispose();
        b.dispose();
        result.dispose();
    } catch (error) {
        console.log('   Basic operations: FAILED -', error.message);
    }

// Test 2: Simple model creation
console.log('\n2. Testing simple model creation...');
try {
    const input = tf.input({shape: [4], name: 'test_input'});
    const dense = tf.layers.dense({units: 2, activation: 'relu'}).apply(input);
    const output = tf.layers.dense({units: 1, activation: 'sigmoid'}).apply(dense);
    const model = tf.model({inputs: input, outputs: output});
    
    console.log('   Model creation: OK');
    console.log('   Model summary:');
    model.summary();
    
    // Test prediction
    const testInput = tf.tensor2d([[1, 2, 3, 4]], [1, 4]);
    const prediction = model.predict(testInput);
    console.log('   Prediction shape:', prediction.shape);
    
    testInput.dispose();
    prediction.dispose();
    model.dispose();
} catch (error) {
    console.log('   Model creation: FAILED -', error.message);
}

// Test 3: Multi-input model (like ours)
console.log('\n3. Testing multi-input model...');
try {
    const input1 = tf.input({shape: [15], name: 'input1', dtype: 'int32'});
    const input2 = tf.input({shape: [4], name: 'input2', dtype: 'float32'});
    const input3 = tf.input({shape: [4], name: 'input3', dtype: 'float32'});
    
    const embedding = tf.layers.embedding({inputDim: 1000, outputDim: 100}).apply(input1);
    const flattened = tf.layers.flatten().apply(embedding);
    
    const concatenated = tf.layers.concatenate().apply([flattened, input2, input3]);
    const dense1 = tf.layers.dense({units: 128, activation: 'relu'}).apply(concatenated);
    const output1 = tf.layers.dense({units: 5, activation: 'softmax', name: 'category'}).apply(dense1);
    const output2 = tf.layers.dense({units: 10, activation: 'softmax', name: 'subcategory'}).apply(dense1);
    
    const multiModel = tf.model({
        inputs: [input1, input2, input3],
        outputs: [output1, output2]
    });
    
    console.log('   Multi-input model: OK');
    console.log('   Multi-input model summary:');
    multiModel.summary();
    
    multiModel.dispose();
} catch (error) {
    console.log('   Multi-input model: FAILED -', error.message);
    console.log('   Error stack:', error.stack);
}

    console.log('\n=== TEST COMPLETE ===');
}

runTests();
