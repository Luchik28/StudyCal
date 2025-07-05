const fs = require('fs');
const path = require('path');

function inspectModelStructure() {
    const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    console.log('Inspecting model structure...');
    
    const layers = modelJson.modelTopology.model_config.config.layers;
    
    console.log(`\nFound ${layers.length} layers:`);
    
    layers.forEach((layer, i) => {
        console.log(`\nLayer ${i + 1}: ${layer.class_name} (${layer.name})`);
        console.log(`  Config keys: ${Object.keys(layer.config)}`);
        
        if (layer.inbound_nodes) {
            console.log(`  Inbound nodes: ${Array.isArray(layer.inbound_nodes) ? 'Array' : 'Object'}`);
            if (Array.isArray(layer.inbound_nodes)) {
                console.log(`    Length: ${layer.inbound_nodes.length}`);
                layer.inbound_nodes.forEach((node, j) => {
                    console.log(`    Node ${j}: ${typeof node} - ${Array.isArray(node) ? 'Array' : 'Object'}`);
                    if (typeof node === 'object' && !Array.isArray(node)) {
                        console.log(`      Keys: ${Object.keys(node)}`);
                    }
                });
            } else {
                console.log(`    Type: ${typeof layer.inbound_nodes}`);
                console.log(`    Keys: ${Object.keys(layer.inbound_nodes)}`);
            }
        }
    });
    
    // Check output_layers
    const outputLayers = modelJson.modelTopology.model_config.config.output_layers;
    console.log('\nOutput layers:');
    console.log(JSON.stringify(outputLayers, null, 2));
}

inspectModelStructure();
