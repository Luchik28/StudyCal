const fs = require('fs');
const path = require('path');

function convertConcatenateLayer() {
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    console.log('Converting Concatenate layer inbound_nodes...');
    
    const layers = modelJson.modelTopology.model_config.config.layers;
    let modified = false;
    
    layers.forEach((layer, i) => {
        if (layer.class_name === 'Concatenate' && layer.inbound_nodes && Array.isArray(layer.inbound_nodes)) {
            console.log(`Processing Concatenate layer: ${layer.name}`);
            
            const newInboundNodes = [];
            
            layer.inbound_nodes.forEach((node, j) => {
                if (typeof node === 'object' && node.args && Array.isArray(node.args)) {
                    console.log(`  Converting node ${j} from Keras v3 format to TF.js format`);
                    
                    // For Concatenate layers, the first arg is an array of tensors
                    const tensorArray = node.args[0];
                    if (Array.isArray(tensorArray)) {
                        // Convert each tensor in the array
                        const tfjsInputs = tensorArray.map(tensor => {
                            if (tensor && tensor.config && tensor.config.keras_history) {
                                const [layerName, nodeIndex, tensorIndex] = tensor.config.keras_history;
                                return [layerName, nodeIndex, tensorIndex];
                            }
                            return null;
                        }).filter(input => input !== null);
                        
                        // TF.js format for Concatenate: [inputs_array, kwargs]
                        const tfjsNode = [tfjsInputs];
                        
                        // Add kwargs if they exist and are not empty
                        if (node.kwargs && Object.keys(node.kwargs).length > 0) {
                            tfjsNode.push(node.kwargs);
                        }
                        
                        newInboundNodes.push(tfjsNode);
                        modified = true;
                        
                        console.log(`    Converted to: ${JSON.stringify(tfjsNode)}`);
                    } else {
                        console.log(`    Warning: Cannot convert node ${j}, keeping original`);
                        newInboundNodes.push(node);
                    }
                } else {
                    // Node is already in the correct format or empty
                    newInboundNodes.push(node);
                }
            });
            
            if (newInboundNodes.length > 0) {
                layer.inbound_nodes = newInboundNodes;
            }
        }
    });
    
    if (modified) {
        // Create backup first
        const backupPath = modelPath + '.backup5';
        fs.copyFileSync(modelPath, backupPath);
        console.log(`Created backup at ${backupPath}`);
        
        // Write the modified model
        fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));
        console.log('Model updated successfully!');
    } else {
        console.log('No changes needed.');
    }
}

convertConcatenateLayer();
