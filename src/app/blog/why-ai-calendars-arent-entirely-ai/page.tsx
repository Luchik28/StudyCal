import TopBar from '../../../components/TopBar';
import Image from 'next/image';

export default function WhyAICalendarsPost() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl h-auto relative rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-6">
            <Image src="/blog/ai-calendar.png" alt="Why AI Calendars Aren&apos;t Entirely AI" width={800} height={400} className="rounded-xl" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-mono text-center text-gray-900">Why AI Calendars Aren&apos;t Entirely AI</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: 2025-07-16</p>
        </div>
        <div className="prose prose-lg max-w-none whitespace-pre-line mx-auto text-gray-900">
          {`You’ve probably experienced the magic of AI calendars. But how does AI plan your day? How does it know if you’ll need a break after an intense meeting but not after a quick call?

“AI” calendars have somewhat misleading names because they aren’t entirely AI, although they certainly rely heavily on the technology. They’re powered by a combination of traditional algorithms, AI models, and hybrids like constraint optimization algorithms. Traditional algorithms are helpful for solving clearly defined problems, like determining if two events are overlapping, while AI helps solve more general problems, like categorizing tasks and events or determining how long a task could take. 

The core scheduling algorithms, however, use a combination of algorithms and AI to make your perfect schedule. Specifically, they use constraint optimization algorithms. Studycal uses Google’s CP-SAT solver, a constraint optimization algorithm which takes in data and constraints and finds the most optimal solution to the problem. CP-SAT takes in all the data, like the events currently on your calendar and the event it’s trying to schedule, as well as constraints, strict rules the schedule must follow like not creating overlapping events, and things to optimize for, like adding breaks in the schedule. CP-SAT will then intelligently solve the problem, eventually reaching the most optimal schedule, and share it with you.

This hybrid approach of using constraint optimization algorithms can also be used when offering suggestions to help optimize your schedule. It can check your schedule to see how good it is, similar to how it creates the schedule in the first place, and can then see where the schedule could be improved: a break here, some more studying for this test there, and offer the suggestions to the user.

AI can solve much more diverse problems than traditional models, but has a key limitation: it needs lots and lots of data. Studycal’s models use hundreds of thousands of calendar events to learn how to classify events and perform other tasks. To make it even harder to train models, highly sensitive data like your schedule isn’t readily available, making it harder and much more time consuming to train AI models to schedule your day as opposed to employing traditional algorithms. That’s why AI calendars often use traditional algorithms or hybrids as opposed to solely using AI.

Ultimately, AI calendars aren’t just regular calendars with some AI model scheduling your day for you behind the scenes, they’re a highly intricate medley of traditional algorithms and cutting edge AI models..`}
        </div>
      </div>
    </div>
  );
}
