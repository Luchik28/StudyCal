const fs = require('fs');
const path = require('path');

// Let's examine the model structure in detail and see what's causing the infinite loop
function analyzeModelStructure() {
    console.log('=== ANALYZING MODEL STRUCTURE FOR INFINITE LOOP ===');
    
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    const layers = modelJson.modelTopology.model_config.config.layers;
    
    console.log('Checking for circular references or malformed connections...\n');
    
    // Build a map of layer connections
    const connections = {};
    const layerNames = layers.map(layer => layer.name);
    
    console.log('Layer names:', layerNames);
    
    layers.forEach((layer, i) => {
        console.log(`\nLayer ${i}: ${layer.name} (${layer.class_name})`);
        
        connections[layer.name] = {
            inputs: [],
            outputs: [],
            type: layer.class_name
        };
        
        if (layer.inbound_nodes && layer.inbound_nodes.length > 0) {
            layer.inbound_nodes.forEach((node, j) => {
                console.log(`  Inbound node ${j}:`);
                console.log(`    Type: ${typeof node}, Array: ${Array.isArray(node)}`);
                console.log(`    Content: ${JSON.stringify(node, null, 2)}`);
                
                // Check if this looks like it could cause infinite loops
                if (Array.isArray(node)) {
                    if (typeof node[0] === 'string') {
                        // Standard format: [layer_name, node_index, tensor_index]
                        const inputLayerName = node[0];
                        connections[layer.name].inputs.push(inputLayerName);
                        
                        if (!layerNames.includes(inputLayerName)) {
                            console.log(`    WARNING: References non-existent layer: ${inputLayerName}`);
                        }
                    } else if (Array.isArray(node[0])) {
                        // Concatenate format: [[layer1, 0, 0], [layer2, 0, 0], ...]
                        node[0].forEach(input => {
                            if (Array.isArray(input) && typeof input[0] === 'string') {
                                const inputLayerName = input[0];
                                connections[layer.name].inputs.push(inputLayerName);
                                
                                if (!layerNames.includes(inputLayerName)) {
                                    console.log(`    WARNING: References non-existent layer: ${inputLayerName}`);
                                }
                            }
                        });
                    }
                } else if (typeof node === 'object' && node.args) {
                    console.log(`    ERROR: Still has Keras v3 format - not converted!`);
                }
            });
        }
    });
    
    // Check for circular references
    console.log('\n=== CHECKING FOR CIRCULAR REFERENCES ===');
    function findCircularReferences(layerName, visited = new Set(), path = []) {
        if (visited.has(layerName)) {
            console.log(`CIRCULAR REFERENCE FOUND: ${path.join(' -> ')} -> ${layerName}`);
            return true;
        }
        
        visited.add(layerName);
        path.push(layerName);
        
        if (connections[layerName]) {
            for (const input of connections[layerName].inputs) {
                if (findCircularReferences(input, new Set(visited), [...path])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    let foundCircular = false;
    for (const layerName of layerNames) {
        if (findCircularReferences(layerName)) {
            foundCircular = true;
        }
    }
    
    if (!foundCircular) {
        console.log('No circular references found.');
    }
    
    // Check input/output layer references
    console.log('\n=== CHECKING INPUT/OUTPUT LAYER REFERENCES ===');
    const config = modelJson.modelTopology.model_config.config;
    
    console.log('Input layers:', JSON.stringify(config.input_layers, null, 2));
    console.log('Output layers:', JSON.stringify(config.output_layers, null, 2));
    
    // Verify input layers exist
    config.input_layers.forEach(inputRef => {
        const layerName = inputRef[0];
        if (!layerNames.includes(layerName)) {
            console.log(`ERROR: Input layer reference to non-existent layer: ${layerName}`);
        }
    });
    
    // Verify output layers exist
    config.output_layers.forEach(outputRef => {
        const layerName = outputRef[0];
        if (!layerNames.includes(layerName)) {
            console.log(`ERROR: Output layer reference to non-existent layer: ${layerName}`);
        }
    });
}

analyzeModelStructure();
