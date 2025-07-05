const fs = require('fs');
const path = require('path');

function removeInputShapeFromModel() {
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    console.log('Removing inputShape from InputLayers...');
    
    // Find all InputLayers and remove inputShape
    const layers = modelJson.modelTopology.model_config.config.layers;
    let modified = false;
    
    layers.forEach((layer, i) => {
        if (layer.class_name === 'InputLayer') {
            console.log(`Processing InputLayer: ${layer.name}`);
            if (layer.config.inputShape) {
                console.log(`  Removing inputShape: ${JSON.stringify(layer.config.inputShape)}`);
                delete layer.config.inputShape;
                modified = true;
            }
            if (layer.config.batchInputShape) {
                console.log(`  Keeping batchInputShape: ${JSON.stringify(layer.config.batchInputShape)}`);
            }
        }
    });
    
    if (modified) {
        // Create backup first
        const backupPath = modelPath + '.backup3';
        fs.copyFileSync(modelPath, backupPath);
        console.log(`Created backup at ${backupPath}`);
        
        // Write the modified model
        fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));
        console.log('Model updated successfully!');
    } else {
        console.log('No changes needed.');
    }
}

removeInputShapeFromModel();
