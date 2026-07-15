import TopBar from '../../../components/TopBar';
import Image from 'next/image';

export default function SpacingPost() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-full max-w-2xl h-auto relative rounded-xl overflow-hidden flex items-center justify-center mx-auto mb-6">
            <Image src="/blog/Graph.png" alt="Cramming vs. Spacing" width={800} height={400} className="rounded-xl" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-mono text-center text-gray-900">Cramming vs. Spacing: When to Put Study Sessions on Your Calendar</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: 2026-07-09</p>
        </div>

        <div className="prose prose-lg max-w-none mx-auto text-gray-900">
          <p className="mb-6">
            Most study advice is about <em>how</em> to study. Far less of it is about <em>when</em> — which is strange, because the timing of your study sessions has a larger, better-documented effect on what you remember than almost anything else you could change.
          </p>
          <p className="mb-6">
            And unlike “use active recall” or “stop rereading your notes,” timing is a scheduling decision. It happens on a calendar, on Sunday night, before you’ve studied anything at all.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">The spacing effect, briefly</h2>
          <p className="mb-6">
            Take a fixed amount of study time — say, four hours — and split it two ways. Version A: four hours the night before the exam. Version B: four one-hour sessions spread across two weeks. Same material, same total minutes.
          </p>
          <p className="mb-6">
            Version B wins, and it isn’t close. Cepeda and colleagues pulled together 839 separate assessments of this comparison across 317 experiments in their 2006 meta-analysis, and the spaced condition beat the massed condition consistently enough that the debate is basically settled. In 2013, a review team led by John Dunlosky ranked ten popular study techniques by how well the evidence supported them. Distributed practice and practice testing were the only two that earned a “high utility” rating. Highlighting, summarization, and rereading — the three things students actually do — all landed in the lowest tier.
          </p>
          <p className="mb-6">
            The reason cramming feels effective is that it works, temporarily. Material you crammed on Thursday is genuinely accessible on Friday. It’s gone by the following Thursday, which is a problem if there’s a final, or a second course that builds on the first, or a career.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">So how far apart should sessions be?</h2>
          <p className="mb-6">
            This is the question most articles skip, and it has a surprisingly concrete answer. Cepeda’s team ran a follow-up study with more than 1,350 people: teach a set of facts, wait some gap, review, then test after a further delay of up to a year. Varying both the gap and the delay lets you map out where the optimum sits.
          </p>
          <p className="mb-6">
            The finding: <strong>the best gap scales with how long you need to remember the material.</strong> For a test roughly a week out, the optimal gap between sessions was around 20–40% of that interval. For a test a year out, it fell to about 5–10%.
          </p>
          <p className="mb-6">
            Translated into a calendar:
          </p>
          <div className="mb-6" style={{ paddingLeft: '1.5rem' }}>
            <p className="mb-3"><strong>Quiz in one week</strong> → sessions about 1–2 days apart.</p>
            <p className="mb-3"><strong>Midterm in one month</strong> → sessions about a week apart.</p>
            <p className="mb-3"><strong>Final in four months</strong> → revisit each unit every 2–3 weeks.</p>
            <p className="mb-3"><strong>Material you want for the MCAT, or for life</strong> → monthly, more or less indefinitely.</p>
          </div>
          <p className="mb-6">
            One important detail from the same study: the curve around the optimum is asymmetric. Going too long between sessions costs you a little. Going too short costs you a lot. If you’re unsure, err toward spacing them further apart than feels comfortable — the feeling of having forgotten some of it when you sit back down is not a sign the plan is failing. It’s roughly the point.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">Why almost nobody does this</h2>
          <p className="mb-6">
            Not because students haven’t heard of spacing. Because spacing is a scheduling problem, and scheduling problems are miserable to solve by hand.
          </p>
          <p className="mb-6">
            To space one exam properly you have to work backward from the date, pick session lengths, place them at increasing intervals, and then find slots that don’t collide with lectures, work, or the other four courses doing the same thing. Change one exam date and the whole arrangement has to be rebuilt. It’s a constraint satisfaction problem, and humans are bad at those — not through any failing of character, but because the search space is large and we solve it by guessing.
          </p>
          <p className="mb-6">
            This is more or less exactly what StudyCal’s scheduler exists for. You give it the exam and the material; it works backward and places sessions where they fit, at intervals that respect the research rather than whatever’s left open on Thursday. (If you’re curious how that works under the hood, we wrote about <a href="/blog/why-ai-calendars-arent-entirely-ai" className="text-blue-700 underline">why AI calendars aren’t entirely AI</a> — the scheduling core is a constraint solver, not a language model.)
          </p>
          <p className="mb-6">
            But the technique doesn’t require our product, or any product. It requires a calendar and a willingness to schedule your third review of thermodynamics for two weeks from Tuesday, at a moment when thermodynamics feels comfortably learned. That last part is the genuinely hard bit. Everything you feel in the moment tells you that session is unnecessary.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">One thing to pair it with</h2>
          <p className="mb-6">
            Distributed practice was one of two high-utility techniques in the Dunlosky review. The other was practice testing. They compound: spacing determines when you sit down, retrieval determines what you do once you’re there.
          </p>
          <p className="mb-6">
            So make each spaced session a retrieval session. Close the notes. Try to reconstruct the mechanism, derive the formula, list the causes of the war, from memory, badly, before you check. The forgetting you experience between sessions is what makes the retrieval effortful, and the effort is where the learning lives.
          </p>
          <p className="mb-6">
            Which means the two techniques aren’t really separate. Spacing is what makes testing hard enough to work.
          </p>

          <hr className="my-10" />
          <h3 className="text-xl font-bold mb-3 text-gray-900">Sources</h3>
          <ul className="text-gray-700 text-base space-y-2">
            <li>
              Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., &amp; Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. <em>Psychological Bulletin, 132</em>(3), 354–380. <a href="https://pubmed.ncbi.nlm.nih.gov/16719566/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">PubMed</a>
            </li>
            <li>
              Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., &amp; Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. <em>Psychological Science, 19</em>(11), 1095–1102. <a href="https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">PDF</a>
            </li>
            <li>
              Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., &amp; Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. <em>Psychological Science in the Public Interest, 14</em>(1), 4–58. <a href="https://journals.sagepub.com/doi/abs/10.1177/1529100612453266" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Link</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
