import TopBar from '../../../components/TopBar';
import Image from 'next/image';

export default function SleepPost() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl h-auto relative rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-6">
            <Image src="/blog/ScheduledvsFree.png" alt="Your Sleep Schedule Is Part of Your Study Schedule" width={800} height={400} className="rounded-xl" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-mono text-center text-gray-900">Your Sleep Schedule Is Part of Your Study Schedule</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: 2026-07-09</p>
        </div>

        <div className="prose prose-lg max-w-none mx-auto text-gray-900">
          <p className="mb-6">
            Nobody puts sleep on their calendar. It’s what happens in the space left over after everything that <em>is</em> on the calendar finishes — which is to say, it’s the variable that absorbs every overrun, every underestimated problem set, every 11pm decision to do one more chapter.
          </p>
          <p className="mb-6">
            That’s a strange way to treat the input that predicts your grades better than most of the things you do schedule.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">What the MIT chemistry study found</h2>
          <p className="mb-6">
            In 2019, a team led by Kana Okano at MIT put Fitbits on 88 students in an introductory solid-state chemistry course and tracked their sleep across the full 14-week semester, then lined it up against eight quizzes and three midterms.
          </p>
          <p className="mb-6">
            Sleep measures accounted for about <strong>24% of the variance in academic performance</strong>. Roughly a quarter of the spread between the top of that class and the bottom, explained by how people slept. It broke down about evenly across three things: how long they slept (r = 0.38), how well they slept (r = 0.44), and how <em>consistent</em> their sleep was from night to night (r = −0.36 for inconsistency).
          </p>
          <p className="mb-6">
            That third one deserves attention, because it isn’t what most people mean by “get enough sleep.” Two students can both average 7 hours. One does 7 every night; the other does 5, 5, 9, 5, 11. The second student is measurably worse off. Consistency was pulling roughly as much weight as duration.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">The night before doesn’t matter</h2>
          <p className="mb-6">
            Here’s the finding that should change how you plan. The researchers checked sleep on the night immediately before each midterm and quiz. It showed <strong>no significant correlation with performance</strong>. None.
          </p>
          <p className="mb-6">
            What predicted the score was sleep over the <em>week and the month</em> leading up to the test.
          </p>
          <p className="mb-6">
            Read that carefully, because it cuts against the usual moral. The advice “get a good night’s sleep before the exam” is, on this evidence, close to useless — not because sleep doesn’t matter, but because by the night before, the relevant sleep already happened or didn’t. Your exam performance was substantially determined during the weeks you were learning the material, when sleep was consolidating it. One virtuous Thursday cannot retroactively fix October.
          </p>
          <p className="mb-6">
            Which also means the all-nighter is worse than it looks. It doesn’t just cost you the next day. It’s a withdrawal from the account that was funding your retention the whole time.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">And bedtime is doing something on its own</h2>
          <p className="mb-6">
            The MIT team split the class at the median bedtime — which was, memorably, 1:47am. Students who typically went to bed before that scored <strong>77.25%</strong> on average. Students who went to bed after it scored <strong>70.68%</strong>. Earlier bedtime correlated with better performance at r = −0.45, the strongest single relationship in the study.
          </p>
          <p className="mb-6">
            Six and a half percentage points is a letter grade in a lot of courses. It’s also a bigger swing than most of the study-technique interventions students agonize over.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">Treating sleep as a scheduled event</h2>
          <p className="mb-6">
            If sleep is 24% of the outcome, it should occupy space on the calendar the same way a lecture does — as a fixed block that other things route around, not the puddle that forms in whatever’s left.
          </p>
          <p className="mb-6">
            Practically, that means a few things:
          </p>
          <div className="mb-6" style={{ paddingLeft: '1.5rem' }}>
            <p className="mb-3"><strong>Pick a bedtime, then schedule backward from it.</strong> The number that matters isn’t when you plan to fall asleep. It’s when the last work block ends. If you want to be asleep by midnight, nothing gets scheduled past 11.</p>
            <p className="mb-3"><strong>Protect the boring nights, not the dramatic ones.</strong> Tuesday of week 4 is where the grade is decided. The night before the final is decorative.</p>
            <p className="mb-3"><strong>Optimize for the same time every night, not the highest average.</strong> A consistent 7 beats an oscillating 7.5.</p>
            <p className="mb-3"><strong>Let the schedule absorb the overrun instead.</strong> This is where the <a href="/blog/why-you-always-underestimate-how-long-studying-takes" className="text-blue-700 underline">planning fallacy</a> quietly does its damage — you underestimate the problem set, the overflow has to go somewhere, and sleep is the only block with no one defending it. Build slack into the day and it has somewhere else to go.</p>
          </div>
          <p className="mb-6">
            We designed StudyCal so that sleep is a hard constraint the scheduler won’t schedule over, rather than a suggestion. Not because a calendar can make you sleep — it obviously can’t — but because the alternative is a system that will happily hand you a 1am study block and call it a plan.
          </p>
          <p className="mb-6">
            A study schedule that quietly destroys your sleep isn’t a study schedule. It’s a schedule for spending a lot of hours near a textbook.
          </p>

          <hr className="my-10" />
          <h3 className="text-xl font-bold mb-3 text-gray-900">Sources</h3>
          <ul className="text-gray-700 text-base space-y-2">
            <li>
              Okano, K., Kaczmarzyk, J. R., Dave, N., Gabrieli, J. D. E., &amp; Grossman, J. C. (2019). Sleep quality, duration, and consistency are associated with better academic performance in college students. <em>npj Science of Learning, 4</em>(16). <a href="https://www.nature.com/articles/s41539-019-0055-z" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Nature</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6773696/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Full text</a>
            </li>
            <li>
              Buehler, R., Griffin, D., &amp; Ross, M. (1994). Exploring the “planning fallacy”: Why people underestimate their task completion times. <em>Journal of Personality and Social Psychology, 67</em>(3), 366–381. <a href="https://web.mit.edu/curhan/www/docs/Articles/biases/67_J_Personality_and_Social_Psychology_366,_1994.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">PDF</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
