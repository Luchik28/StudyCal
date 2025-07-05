const fs = require('fs');
const path = require('path');

function fixBatchInputShape() {
    console.log('Fixing batch_input_shape in TensorFlow.js model...');
    
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    let modelContent = fs.readFileSync(modelPath, 'utf8');
    
    console.log('Original model size:', modelContent.length, 'chars');
    
    // Replace batch_input_shape with batchInputShape
    const fixedContent = modelContent.replace(/batch_input_shape/g, 'batchInputShape');
    
    console.log('Fixed model size:', fixedContent.length, 'chars');
    
    // Create backup
    const backupPath = modelPath + '.backup_fix';
    fs.copyFileSync(modelPath, backupPath);
    console.log('Backup created at:', backupPath);
    
    // Write fixed model
    fs.writeFileSync(modelPath, fixedContent);
    console.log('Model fixed successfully!');
    
    // Verify the fix
    const modelJson = JSON.parse(fixedContent);
    const inputLayers = modelJson.modelTopology.config.layers.filter(layer => layer.class_name === 'InputLayer');
    
    console.log('InputLayers after fix:');
    inputLayers.forEach((layer, i) => {
        console.log(`  ${i + 1}. ${layer.name}:`);
        console.log('     Has batchInputShape:', 'batchInputShape' in layer.config);
        console.log('     Has batch_input_shape:', 'batch_input_shape' in layer.config);
        if (layer.config.batchInputShape) {
            console.log('     batchInputShape:', layer.config.batchInputShape);
        }
    });
}

fixBatchInputShape();
