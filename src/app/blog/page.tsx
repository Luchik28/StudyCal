import Link from 'next/link';
import Image from 'next/image';
import TopBar from '../../components/TopBar';

const posts = [
	{
		slug: 'why-ai-calendars-arent-entirely-ai',
		title: "Why AI Calendars Aren't Entirely AI",
		date: '2025-07-16',
		image: '/blog/ai-calendar.png',
		preview: `You’ve probably experienced the magic of AI calendars. But how does AI plan your day? How does it know if you’ll need a break after an intense meeting but not after a quick call? “AI” calendars have somewhat misleading names because they aren’t entirely AI, although they certainly rely heavily on the technology...`,
	},
	// Add more posts here as needed
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
