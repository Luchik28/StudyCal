// Simple test script to check TensorFlow model functionality
// This can be run in the browser console

console.log('Testing TensorFlow.js model classification...');

// Test data that matches the expected format
const testEvents = [
  {
    id: '1',
    title: 'Mathematics Lecture',
    description: 'Linear algebra course',
    startTime: new Date(2025, 5, 23, 9, 0),
    endTime: new Date(2025, 5, 23, 10, 0),
    color: '#3B82F6',
    dayOfWeek: 1,
  },
  {
    id: '2',
    title: 'Lunch Break',
    description: 'Time to eat',
    startTime: new Date(2025, 5, 23, 12, 0),
    endTime: new Date(2025, 5, 23, 13, 0),
    color: '#10B981',
    dayOfWeek: 1,
  }
];

// Function to test classification
async function testClassification() {
  try {
    // Import the classification functions
    const { classifyAllEvents, isModelLoaded } = await import('./src/utils/eventClassification.js');
    
    console.log('Model loaded status:', await isModelLoaded());
    
    // Wait a bit for model to load if needed
    if (!await isModelLoaded()) {
      console.log('Waiting for model to load...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('Running classification on test events...');
    const classifiedEvents = await classifyAllEvents(testEvents);
    
    console.log('Classification results:', classifiedEvents);
    
  } catch (error) {
    console.error('Classification test failed:', error);
  }
}

// Run the test
testClassification();
