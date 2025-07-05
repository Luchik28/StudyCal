'use client';

import { useState, useEffect } from 'react';
import { loadClassificationModel, classifyEvent, isModelLoaded } from '@/utils/eventClassification';

export default function ModelTest() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [testResult, setTestResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testEvent = {
    id: 'test-1',
    title: 'Team Meeting',
    startTime: new Date('2024-01-15T14:00:00'),
    endTime: new Date('2024-01-15T15:00:00'),
    category: 'Work',
    subcategory: 'Meeting',
    color: '#3b82f6',
    dayOfWeek: 0
  };

  useEffect(() => {
    const runTest = async () => {
      try {
        setStatus('Loading model...');
        setError('');
        
        // First, let's test TensorFlow.js basic functionality
        console.log('TensorFlow.js version:', await import('@tensorflow/tfjs').then(tf => tf.version.tfjs));
        
        // Test model loading with more detailed error handling
        setStatus('Fetching model JSON...');
        const cacheBuster = `?v=${Date.now()}`;
        const modelUrl = `/tfjs_multi_output_model_v2/model.json${cacheBuster}`;
        console.log('Loading model from:', modelUrl);
        
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
        }
        
        const modelJson = await response.json();
        console.log('Model JSON loaded, format:', modelJson.format);
        
        // Check model structure - TensorFlow.js native vs Keras export format
        let layers;
        if (modelJson.modelTopology.model_config?.config?.layers) {
          // Keras export format
          layers = modelJson.modelTopology.model_config.config.layers;
          console.log('Using Keras export format');
        } else if (modelJson.modelTopology.config?.layers) {
          // TensorFlow.js native format
          layers = modelJson.modelTopology.config.layers;
          console.log('Using TensorFlow.js native format');
        } else {
          throw new Error('Unknown model format');
        }
        
        console.log('Model layers:', layers.length);
        
        // Check InputLayers specifically
        const inputLayers = layers.filter(
          (layer: any) => layer.class_name === 'InputLayer'
        );
        console.log('InputLayers found:', inputLayers.length);
        inputLayers.forEach((layer: any, i: number) => {
          console.log(`InputLayer ${i + 1}:`, {
            name: layer.name,
            batchInputShape: layer.config?.batchInputShape,
            inputShape: layer.config?.inputShape,
            dtype: layer.config?.dtype
          });
        });
        
        setStatus('Loading TensorFlow.js model...');
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        console.log('TF.js backend:', tf.getBackend());
        
        // Load the model using the proper function that sets up global variables
        await loadClassificationModel();
        
        setStatus('Model loaded successfully!');
        
        // Test classification
        setStatus('Testing classification...');
        const result = await classifyEvent(testEvent);
        
        setTestResult(`
Classification Result:
- Category: ${result.category} (confidence: ${(result.categoryConfidence * 100).toFixed(1)}%)
- Subcategory: ${result.subcategory} (confidence: ${(result.subcategoryConfidence * 100).toFixed(1)}%)
        `);
        
        setStatus('Test completed successfully!');
        
      } catch (err) {
        console.error('Test error:', err);
        setError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
        setStatus('Test failed');
      }
    };

    runTest();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">TensorFlow.js Model Test</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
          {status}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {testResult && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Test Result</h2>
          <pre className="text-sm text-green-700 whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Event</h2>
        <pre className="text-sm text-blue-700 whitespace-pre-wrap">
{JSON.stringify(testEvent, null, 2)}
        </pre>
      </div>
    </div>
  );
}
