// Enhanced fix for model.json to ensure TensorFlow.js compatibility
const fs = require('fs');
const path = require('path');

console.log('Applying enhanced TensorFlow.js compatibility fix...');

const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
const backupPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json.backup2');

try {
  // Read the current model.json
  const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  
  // Create another backup
  fs.writeFileSync(backupPath, JSON.stringify(modelData, null, 2));
  console.log('Additional backup created at:', backupPath);
  
  // Fix the InputLayer configurations
  const layers = modelData.modelTopology.model_config.config.layers;
  
  for (let layer of layers) {
    if (layer.class_name === 'InputLayer') {
      console.log(`Enhancing InputLayer: ${layer.name}`);
      
      if (layer.config.batchInputShape) {
        console.log(`  Current batchInputShape: ${JSON.stringify(layer.config.batchInputShape)}`);
        
        // Add inputShape as well (without the batch dimension)
        const batchInputShape = layer.config.batchInputShape;
        if (Array.isArray(batchInputShape) && batchInputShape.length > 1) {
          // Remove the first element (batch dimension) to get inputShape
          layer.config.inputShape = batchInputShape.slice(1);
          console.log(`  Added inputShape: ${JSON.stringify(layer.config.inputShape)}`);
        }
        
        // Ensure other required properties are present
        if (!layer.config.sparse) layer.config.sparse = false;
        if (!layer.config.ragged) layer.config.ragged = false;
        
        console.log(`  Final config: ${JSON.stringify(layer.config)}`);
      }
    }
  }
  
  // Write the enhanced model.json
  fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
  console.log('Enhanced model.json created successfully!');
  
  // Verify the fix
  console.log('\nVerifying enhanced fix...');
  const fixedModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  const inputLayers = fixedModel.modelTopology.model_config.config.layers.filter(layer => 
    layer.class_name === 'InputLayer'
  );
  
  console.log('Enhanced InputLayers:');
  inputLayers.forEach((layer, i) => {
    console.log(`  ${i + 1}. ${layer.name}:`);
    console.log(`     batchInputShape: ${JSON.stringify(layer.config.batchInputShape)}`);
    console.log(`     inputShape: ${JSON.stringify(layer.config.inputShape)}`);
    console.log(`     dtype: ${layer.config.dtype}`);
  });
  
} catch (error) {
  console.error('Error applying enhanced fix:', error.message);
}
