import Link from 'next/link';
import Image from 'next/image';
import TopBar from '../../components/TopBar';

const posts = [
	{
		slug: 'your-sleep-schedule-is-part-of-your-study-schedule',
		title: 'Your Sleep Schedule Is Part of Your Study Schedule',
		date: '2026-07-09',
		image: '/blog/ScheduledvsFree.png',
		preview: `MIT researchers put Fitbits on 88 chemistry students for a semester. Sleep explained about a quarter of the variance in their grades — and sleep the night before a test explained none of it. What that means for how you build a week...`,
	},
	{
		slug: 'cramming-vs-spacing-how-to-schedule-study-sessions',
		title: 'Cramming vs. Spacing: When to Put Study Sessions on Your Calendar',
		date: '2026-07-09',
		image: '/blog/Graph.png',
		preview: `Most study advice is about how to study. Far less is about when — which is strange, because the timing of your sessions has a larger, better-documented effect on what you remember than almost anything else. Here's how far apart they should actually be...`,
	},
	{
		slug: 'why-you-always-underestimate-how-long-studying-takes',
		title: 'Why You Always Underestimate How Long Studying Takes',
		date: '2026-07-09',
		image: '/blog/ListOfCategories.png',
		preview: `You block out two hours for a problem set and it takes four. This isn't a discipline problem — it's one of the most reliably reproduced findings in psychology, and pessimism won't fix it. But something else will...`,
	},
	{
		slug: 'how-to-use-studycal-analytics',
		title: "How to Use StudyCal's new Analytics",
		date: "2025-07-23",
		image: '/blog/FullAnalytics.png',
		preview: `A guide to the new analytics features in StudyCal, including category breakdowns, subcategory charts, and more.`,
	},
	{
		slug: 'how-to-use-synthetic-data-to-train-AI-models',
		title: 'How to Use Synthetic Data to Train AI Models',
		date: '2025-07-19',
		image: '/blog/data.png',
		preview: `AI models need a lot of data, which can sometimes be hard to get. This is especially true for sensitive, private data like the calendar data Studycal’s models use. So how can you get sensitive data easily, quickly, and for free...`,
	},
	{
		slug: 'why-ai-calendars-arent-entirely-ai',
		title: "Why AI Calendars Aren't Entirely AI",
		date: '2025-07-16',
		image: '/blog/ai-calendar.png',
		preview: `You’ve probably experienced the magic of AI calendars. But how does AI plan your day? How does it know if you’ll need a break after an intense meeting but not after a quick call? “AI” calendars have somewhat misleading names because they aren’t entirely AI, although they certainly rely heavily on the technology...`,
	},
];

export default function BlogIndex() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			<TopBar />
			<div className="max-w-3xl mx-auto py-16 px-4">
				<h1 className="text-4xl font-bold mb-8 text-center font-mono text-gray-900">
					Blog
				</h1>
				<div className="space-y-12">
					{posts.map((post) => (
						<div
							key={post.slug}
							className="bg-white rounded-xl shadow p-6 flex flex-col gap-6 items-center"
						>
							<div className="w-full max-w-2xl h-auto relative rounded-lg overflow-hidden flex items-center justify-center mx-auto">
								<Image
									src={post.image}
									alt={post.title}
									width={700}
									height={400}
									className="rounded-lg"
									style={{ objectFit: 'contain' }}
								/>
							</div>
							<div className="w-full flex-1 flex flex-col justify-between items-center text-center">
								<Link
									href={`/blog/${post.slug}`}
									className="text-2xl font-bold text-blue-700 hover:underline font-mono"
								>
									{post.title}
								</Link>
								<p className="text-gray-500 text-sm mt-1">
									Last updated: {post.date}
								</p>
								{post.preview && (
									<p className="text-gray-700 text-base mt-3 line-clamp-3">
										{post.preview}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
