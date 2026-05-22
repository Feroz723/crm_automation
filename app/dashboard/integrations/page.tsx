'use client'

import { useState } from 'react'
import {
    Webhook,
    Facebook,
    Globe,
    Copy,
    Check,
    Play,
    Info,
    ArrowRight
} from 'lucide-react'
import { useDemoInjector } from '@/components/dashboard/DemoInjector'

export default function IntegrationsPage() {
    const [copied, setCopied] = useState(false)
    const { injectDemoLead, isInjecting } = useDemoInjector()

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/webhook/generic`
        : 'https://[your-domain]/api/webhook/generic'

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const integrations = [
        {
            title: 'Website Forms',
            icon: Globe,
            description: 'Connect any HTML form, WordPress, or Webflow site.',
            instructions: 'Paste the Webhook URL below into your form backend or plugin settings.',
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            title: 'Social Lead Ads',
            icon: Facebook,
            description: 'Capture leads from Facebook & Instagram Instant Forms.',
            instructions: 'Use Zapier or n8n to forward the ad payload to the Webhook URL.',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            link: 'https://zapier.com/apps/webhook/integrations',
            linkText: 'Webhook documentation'
        }
    ]

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Integrations Hub</h1>
                    <p className="text-neutral-500 mt-1">Connect your lead sources to start the AI evaluation process.</p>
                </div>
            </div>

            {/* Quick Start: Demo Lead */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Play className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900">Demo Mode</h3>
                        <p className="text-sm text-neutral-500">Generate a sample lead to test the AI pipeline immediately.</p>
                    </div>
                </div>
                <button
                    onClick={injectDemoLead}
                    disabled={isInjecting}
                    className="flex items-center px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
                >
                    {isInjecting ? 'Generating...' : 'Generate Sample Lead'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Webhook Configuration */}
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-neutral-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                                <Webhook className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-neutral-900">Universal Webhook</h2>
                        </div>
                        <p className="text-neutral-600 text-sm mb-6">
                            This is your secure endpoint for receiving leads. It accepts standard JSON payloads.
                        </p>

                        <div className="relative">
                            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                Your Webhook URL
                            </label>
                            <div className="flex shadow-sm rounded-lg overflow-hidden bg-neutral-50 border border-neutral-300">
                                <code className="flex-1 p-3 text-sm font-mono text-neutral-700 truncate">
                                    {webhookUrl}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="px-4 bg-white border-l border-neutral-300 text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 transition-colors flex items-center justify-center min-w-[3rem]"
                                    title="Copy URL"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <h4 className="flex items-center text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                <Info className="w-4 h-4 mr-2" /> Sample JSON Payload
                            </h4>
                            <pre className="text-xs font-mono text-neutral-600 overflow-x-auto">
                                {`{
  "email": "lead@university.edu",
  "first_name": "Alice",
  "last_name": "Smith",
  "phone": "+15550123456",
  "background_info": "Interested in AI research grants..."
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Integration Cards */}
                {integrations.map((item) => {
                    const Icon = item.icon
                    return (
                        <div key={item.title} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-medium text-neutral-500 hover:text-primary-600 flex items-center"
                                    >
                                        {item.linkText} <ArrowRight className="w-3 h-3 ml-1" />
                                    </a>
                                )}
                            </div>
                            <h3 className="font-bold text-neutral-900 mb-2">{item.title}</h3>
                            <p className="text-sm text-neutral-600 mb-4 h-10">{item.description}</p>
                            <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 border border-neutral-100">
                                <strong>Setup: </strong>{item.instructions}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
