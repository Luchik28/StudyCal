import TopBar from '../../../components/TopBar';
import Image from 'next/image';

export default function PlanningFallacyPost() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl h-auto relative rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-6">
            <Image src="/blog/ListOfCategories.png" alt="Why You Always Underestimate How Long Studying Takes" width={800} height={400} className="rounded-xl" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-mono text-center text-gray-900">Why You Always Underestimate How Long Studying Takes</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: 2026-07-09</p>
        </div>

        <div className="prose prose-lg max-w-none mx-auto text-gray-900">
          <p className="mb-6">
            You block out two hours for a problem set. Four hours later you’re still on question three, dinner didn’t happen, and the rest of the week’s plan has quietly collapsed. Then next week you block out two hours for the next problem set.
          </p>
          <p className="mb-6">
            This isn’t a discipline problem. It’s one of the most reliably reproduced findings in psychology, and it has a name.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">The planning fallacy</h2>
          <p className="mb-6">
            In 1994, Roger Buehler, Dale Griffin and Michael Ross asked psychology students to predict when they’d finish their thesis. Students gave three numbers: a realistic estimate, a best-case estimate, and a worst-case, everything-goes-wrong estimate. The average realistic guess was 33.9 days. The average worst-case guess was 48.6 days.
          </p>
          <p className="mb-6">
            They actually finished in 55.5 days, on average. The students blew past the scenario they’d described as everything going wrong. Only about 30% of them finished by the time they had predicted.
          </p>
          <p className="mb-6">
            The most interesting part of that research isn’t the miss — it’s <em>why</em> the miss happens. Across five studies, the same people who wildly underestimated their own timelines were reasonably accurate at predicting how long <em>other people</em> would take. When you plan your own work, you build a story: I sit down, I open the textbook, I work through the chapter. The story is internally coherent, and nothing in it accounts for the roommate, the migraine, the fact that chapter 7 assumes you understood chapter 6. When you predict someone else’s timeline, you don’t have access to their story, so you fall back on how these things usually go. Which turns out to be the better method.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">The fix isn’t trying harder to be realistic</h2>
          <p className="mb-6">
            Notice that the students in the study <em>were</em> asked to imagine things going badly. It didn’t help. Pessimism, on its own, is not a correction — you just tell yourself a slightly darker version of the same story.
          </p>
          <p className="mb-6">
            What works is throwing out the story and using the data. Instead of asking “how long will this problem set take?”, ask “how long did the last four problem sets take?” This is sometimes called reference-class forecasting, and it’s the same principle that makes a contractor’s estimate more useful than a homeowner’s.
          </p>
          <p className="mb-6">
            The catch, obviously, is that most students have no idea how long the last four problem sets took. The memory of a study session compresses down to “a while.” This is a big part of why we built StudyCal’s <a href="/blog/how-to-use-studycal-analytics" className="text-blue-700 underline">analytics view</a> around actual logged time per category, with a comparison against the previous period. Not because a pie chart is intrinsically motivating, but because the number in that chart is the only honest input you have for next week’s plan.
          </p>
          <p className="mb-6">
            A rough rule that holds up well in practice: take your gut estimate, multiply by 1.5, and check it against what similar work actually cost you last month. If the two disagree, believe the log.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">Then make the plan specific enough to survive</h2>
          <p className="mb-6">
            Better estimates fix the arithmetic of your week. They don’t fix the part where you had every intention of studying Thursday evening and simply… didn’t.
          </p>
          <p className="mb-6">
            For that, there’s a body of research on what Peter Gollwitzer calls implementation intentions — plans in the form “when situation X arises, I will do Y.” Not “I’ll study organic chem this week,” but “when I finish my 2pm lecture on Tuesday, I’ll go to the third-floor library and do the reaction mechanisms.” The 2006 meta-analysis by Gollwitzer and Sheeran pooled 94 independent tests and found a medium-to-large effect (d = 0.65) on goal attainment compared to just holding the goal.
          </p>
          <p className="mb-6">
            The mechanism is unglamorous. You’re not summoning willpower at 7pm Thursday. You pre-decided, once, when your brain was calm, and you attached the decision to a cue you’ll definitely encounter. The cue does the remembering for you.
          </p>
          <p className="mb-6">
            A calendar event with a specific time and a specific place is, structurally, an implementation intention. That’s most of why time-blocking works at all — not because a block of time is magic, but because “Tuesday 3:30, library, mechanisms” is a fundamentally different instruction than “study more.”
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">What this looks like on Sunday night</h2>
          <p className="mb-6">
            Concretely, three things:
          </p>
          <div className="mb-6" style={{ paddingLeft: '1.5rem' }}>
            <p className="mb-3"><strong>1.</strong> Before estimating anything, look at last week. How much time did “Coursework” actually take? Start there, not from your instinct.</p>
            <p className="mb-3"><strong>2.</strong> Give every study block a place and a trigger, not just a duration. “Right after breakfast, kitchen table” beats “sometime Saturday morning.”</p>
            <p className="mb-3"><strong>3.</strong> Leave real slack. Not a token 15 minutes — the research says your worst case is optimistic, so budget accordingly. Unscheduled time isn’t wasted time; it’s the buffer that keeps one bad Tuesday from taking the week with it.</p>
          </div>
          <p className="mb-6">
            None of this makes you faster. It makes your plan match the person who has to execute it, which is the part that was broken.
          </p>

          <hr className="my-10" />
          <h3 className="text-xl font-bold mb-3 text-gray-900">Sources</h3>
          <ul className="text-gray-700 text-base space-y-2">
            <li>
              Buehler, R., Griffin, D., &amp; Ross, M. (1994). Exploring the “planning fallacy”: Why people underestimate their task completion times. <em>Journal of Personality and Social Psychology, 67</em>(3), 366–381. <a href="https://web.mit.edu/curhan/www/docs/Articles/biases/67_J_Personality_and_Social_Psychology_366,_1994.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">PDF</a>
            </li>
            <li>
              Gollwitzer, P. M., &amp; Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. <em>Advances in Experimental Social Psychology, 38</em>, 69–119. <a href="https://www.researchgate.net/publication/37367696_Implementation_Intentions_and_Goal_Achievement_A_Meta-Analysis_of_Effects_and_Processes" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Link</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
