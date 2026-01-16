export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
                <h1 className="text-4xl font-bold text-center mb-8">
                    HostMaster
                </h1>
                <p className="text-xl text-center text-gray-600 dark:text-gray-400">
                    AWS Cost Optimization Platform
                </p>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                        <h2 className="text-2xl font-semibold mb-2">Resource Discovery</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Scan and inventory all your AWS resources across regions
                        </p>
                    </div>

                    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                        <h2 className="text-2xl font-semibold mb-2">Cost Analysis</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Detailed cost breakdown by service, region, and resource
                        </p>
                    </div>

                    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                        <h2 className="text-2xl font-semibold mb-2">Recommendations</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            AI-powered optimization suggestions to reduce AWS spend
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-4">
                    <a
                        href="/login"
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Get Started
                    </a>
                    <a
                        href="https://github.com/Raj-glitch-max/HostMaster"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        View on GitHub
                    </a>
                </div>
            </div>
        </main>
    )
}
