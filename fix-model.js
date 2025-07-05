// Fix model.json for TensorFlow.js compatibility
const fs = require('fs');
const path = require('path');

console.log('Fixing model.json for TensorFlow.js compatibility...');

const modelPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json');
const backupPath = path.join(__dirname, 'public', 'calendar_event_classification_model', 'model.json.backup');

try {
  // Read the original model.json
  const originalModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  
  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(originalModel, null, 2));
  console.log('Backup created at:', backupPath);
  
  // Fix the InputLayer configurations
  const layers = originalModel.modelTopology.model_config.config.layers;
  
  for (let layer of layers) {
    if (layer.class_name === 'InputLayer' && layer.config.batch_shape) {
      console.log(`Fixing InputLayer: ${layer.name}`);
      console.log(`  Original batch_shape: ${JSON.stringify(layer.config.batch_shape)}`);
      
      // Convert batch_shape to batchInputShape
      layer.config.batchInputShape = layer.config.batch_shape;
      delete layer.config.batch_shape;
      
      console.log(`  New batchInputShape: ${JSON.stringify(layer.config.batchInputShape)}`);
    }
  }
  
  // Write the fixed model.json
  fs.writeFileSync(modelPath, JSON.stringify(originalModel, null, 2));
  console.log('Model.json fixed successfully!');
  
  // Verify the fix
  console.log('\nVerifying fix...');
  const fixedModel = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
  const inputLayers = fixedModel.modelTopology.model_config.config.layers.filter(layer => 
    layer.class_name === 'InputLayer'
  );
  
  console.log('Fixed InputLayers:');
  inputLayers.forEach((layer, i) => {
    console.log(`  ${i + 1}. ${layer.name}:`);
    console.log(`     batchInputShape: ${JSON.stringify(layer.config.batchInputShape)}`);
    console.log(`     dtype: ${layer.config.dtype}`);
  });
  
} catch (error) {
  console.error('Error fixing model.json:', error.message);
}
