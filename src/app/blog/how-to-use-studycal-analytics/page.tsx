
import Image from 'next/image';
import TopBar from '../../../components/TopBar';


export default function HowToUseStudyCalAnalytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopBar />
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-6 text-blue-700 font-mono">How to Use StudyCal&apos;s new Analytics</h1>
        <Image src="/blog/FullAnalytics.png" alt="Analytics Overview" width={700} height={400} className="rounded-lg mb-8" />
        <p className="mb-6 text-lg text-gray-800">
          Studycal has just released its new Analytics, more detailed and in depth than before! In addition to seeing how you spend your time by category in the analytics section of the calendar view, you can now open a separate pop up with a more detailed report of the selected time frame. Let&apos;s take a look at some of the new features:
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-2 text-gray-900">Time spent by category</h2>
        <Image src="/blog/Categories.png" alt="Category Pie Chart" width={700} height={400} className="rounded-lg mb-4" />
        <p className="mb-6 text-gray-700">The largest Pi chart is the same chart that&apos;s displayed in the calendar view: a chart of how much time you spend doing activities in each category.</p>
        <h2 className="text-2xl font-bold mt-8 mb-2 text-gray-900">Time spent by subcategory</h2>
        <Image src="/blog/Subcategories.png" alt="Subcategory Pie Chart" width={700} height={400} className="rounded-lg mb-4" />
        <p className="mb-6 text-gray-700">This chart shows you how much time you spend doing activities in each subcategory.</p>
        <h2 className="text-2xl font-bold mt-8 mb-2 text-gray-900">Free vs. Scheduled time</h2>
        <Image src="/blog/ScheduledvsFree.png" alt="Free vs Scheduled Chart" width={700} height={400} className="rounded-lg mb-4" />
        <p className="mb-6 text-gray-700">This chart shows how much of your time is blocked out on your calendar, and how much isn&apos;t.</p>
        <h2 className="text-2xl font-bold mt-8 mb-2 text-gray-900">Details for Each Category</h2>
        <Image src="/blog/ListOfCategories.png" alt="Category Details Table" width={700} height={400} className="rounded-lg mb-4" />
        <p className="mb-6 text-gray-700">This is a list of all the categories, along with how much time you spent in each category, how much time you spent in each category in the previous period, how much that changed, and the number of events you did that fell into that category.</p>
        <h2 className="text-2xl font-bold mt-8 mb-2 text-gray-900">Category Trends Over Time</h2>
        <Image src="/blog/Graph.png" alt="Category Trends Line Chart" width={700} height={400} className="rounded-lg mb-4" />
        <p className="mb-6 text-gray-700">This is a graph of how much time you spend on each category changes over time.</p>
        <hr className="my-8" />
        <p className="text-lg text-gray-800">
          We believe that in order to optimize how you spend your time, you first have to understand how you currently spend your time. We hope this helps with that!
        </p>
      </div>
    </div>
  );
}
