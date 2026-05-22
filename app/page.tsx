import Link from 'next/link'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center text-white space-y-8">
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold tracking-tight">
                        AI-Powered Lead Generation CRM
                    </h1>
                    <p className="text-2xl text-primary-100">
                        Capture, Enrich, Score, and Convert Leads with AI Automation
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/dashboard/leads"
                        className="px-8 py-4 bg-white text-primary-700 rounded-lg font-semibold text-lg hover:bg-neutral-100 transition-colors shadow-lg"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/docs"
                        className="px-8 py-4 bg-primary-800/50 text-white rounded-lg font-semibold text-lg hover:bg-primary-800/70 transition-colors border-2 border-white/20"
                    >
                        View Documentation
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold mb-2">AI Enrichment</h3>
                        <p className="text-primary-100">
                            Automatically enrich leads with AI-powered insights and scoring
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold mb-2">Multi-Source Capture</h3>
                        <p className="text-primary-100">
                            Integrate Facebook Ads, Google Ads, n8n, and website forms
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold mb-2">CRM Sync</h3>
                        <p className="text-primary-100">
                            Seamlessly sync to HubSpot and other CRM platforms
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
