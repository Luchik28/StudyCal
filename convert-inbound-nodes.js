const fs = require('fs');
const path = require('path');

function convertInboundNodesToTFJSFormat() {
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    console.log('Converting inbound_nodes to TensorFlow.js format...');
    
    const layers = modelJson.modelTopology.model_config.config.layers;
    let modified = false;
    
    layers.forEach((layer, i) => {
        if (layer.inbound_nodes && Array.isArray(layer.inbound_nodes)) {
            console.log(`Processing layer: ${layer.name} (${layer.class_name})`);
            
            const newInboundNodes = [];
            
            layer.inbound_nodes.forEach((node, j) => {
                if (typeof node === 'object' && node.args && Array.isArray(node.args)) {
                    console.log(`  Converting node ${j} from Keras v3 format to TF.js format`);
                    
                    // Convert from Keras v3 format to TF.js format
                    // Keras v3: { args: [tensor], kwargs: {} }
                    // TF.js: [layer_name, node_index, tensor_index, kwargs]
                    
                    const arg = node.args[0];
                    if (arg && arg.config && arg.config.keras_history) {
                        const [layerName, nodeIndex, tensorIndex] = arg.config.keras_history;
                        
                        // TF.js format: [layer_name, node_index, tensor_index, kwargs]
                        const tfjsNode = [layerName, nodeIndex, tensorIndex];
                        
                        // Add kwargs if they exist and are not empty
                        if (node.kwargs && Object.keys(node.kwargs).length > 0) {
                            tfjsNode.push(node.kwargs);
                        }
                        
                        newInboundNodes.push(tfjsNode);
                        modified = true;
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
        const backupPath = modelPath + '.backup4';
        fs.copyFileSync(modelPath, backupPath);
        console.log(`Created backup at ${backupPath}`);
        
        // Write the modified model
        fs.writeFileSync(modelPath, JSON.stringify(modelJson, null, 2));
        console.log('Model updated successfully!');
    } else {
        console.log('No changes needed.');
    }
}

convertInboundNodesToTFJSFormat();
