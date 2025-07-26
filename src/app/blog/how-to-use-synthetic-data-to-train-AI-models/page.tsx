import TopBar from '../../../components/TopBar';
import Image from 'next/image';

export default function WhyAICalendarsPost() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl h-auto relative rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-6">
            <Image src="/blog/data.png" alt="Why AI Calendars Aren&apos;t Entirely AI" width={800} height={400} className="rounded-xl" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-mono text-center text-gray-900">How to Use Synthetic Data to Train AI Models</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: 2025-07-19</p>
        </div>
        <div className="prose prose-lg max-w-none whitespace-pre-line mx-auto text-gray-900">
  {`AI models need a lot of data, which can sometimes be hard to get. This is especially true for sensitive, private data like the calendar data Studycal’s models use. So how can you get sensitive data easily, quickly, and for free?

You could collect data from your users, but that would invade their privacy and is impossible if you have a small user base.

You could also try to purchase existing datasets, but for sensitive data, they probably don't exist or are very expensive.

The answer lies in synthetic data, or data that isn’t real. You can generate massive amounts of free data in seconds, without even knowing how to code! Here’s how to do it:`}
  <div style={{ paddingLeft: '2rem' }}>
    {`
1. Determine what data you’ll need. If you’re trying to train a model to determine how long a given task will take, for example, you’ll need a list of tasks and how long they’ll take.

2. Open a chatbot like Gemini. You can prompt this bot to create the code that will generate the data.

3. Ensure you have python and an IDE of your choice, like VS Code, installed on your machine.

4. Prompt the chatbot to create a python script to generate the data you need. Explain that you are creating data for the purposes of AI model training and you need very diverse data. If you need to have names, places, or dates in your data, you can use the Faker library, which can create realistic names for you, just make sure you have the library installed. To start, have the program create 50,000 to 100,000 data points.

5. The AI will create several “templates” and code to fill in any names/places with actual names and places using the Faker library. It should also create code to export the data as a csv file. If it doesn’t, ask it to.

6. Run the code using python (nameOfFile) in your terminal. Assess the quality of the data. If it’s not diverse enough, ask the chatbot to add more “templates.” If some of the data is nonsense/unrealistic, share the pieces of data that are nonsensical and ask the chatbot to fix it. After a few iterations, you should have a usable dataset.

7. Bring the csv file into whatever you’re using to train your mode, and enjoy!
    `}
  </div>
  {`
While synthetic data may not be the highest quality data out there, it’s certainly useful for training models on sensitive, obscure, or expensive datasets when you need to train your model quickly and cheaply. Enjoy your data!`}
</div>
      </div>
    </div>
  );
}
