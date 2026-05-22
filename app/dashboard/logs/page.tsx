'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Webhook, Activity, ChevronRight, Search, Clock, ShieldCheck, AlertCircle } from 'lucide-react'

interface WebhookLog {
    id: string
    source: string
    payload: any
    status: 'success' | 'failed'
    errorMessage: string | null
    createdAt: string
}

interface ActivityLog {
    id: string
    action: string
    description: string
    createdAt: string
    leadId: string
    lead: {
        firstName: string | null
        lastName: string | null
    }
}

export default function LogsPage() {
    const [activeTab, setActiveTab] = useState<'webhook' | 'activity'>('webhook')
    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [activeTab])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            // Note: We'll need to ensure these endpoints exist or handle the default lead fetching
            const endpoint = activeTab === 'webhook' ? '/api/logs/webhook' : '/api/logs/activity'
            // Since I haven't created these specific log endpoints yet, I'll mocked them for now 
            // but in a real app these would be real endpoints.
            // For now, I'll create the API routes for these logs in the next step.
            const response = await fetch(endpoint)
            const data = await response.json()
            if (activeTab === 'webhook') setWebhookLogs((data as any).logs || [])
            else setActivityLogs((data as any).logs || [])
        } catch (error) {
            console.error('Failed to fetch logs:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">System Logs</h1>
                <p className="text-neutral-600 mt-1">Audit trail for webhooks and user activities</p>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="flex border-b border-neutral-200">
                    <button
                        onClick={() => setActiveTab('webhook')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'webhook'
                            ? 'border-primary-600 text-primary-600 bg-primary-50/30'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Webhook className="w-4 h-4" />
                            Webhook Logs
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'activity'
                            ? 'border-primary-600 text-primary-600 bg-primary-50/30'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Activity Logs
                        </div>
                    </button>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-neutral-500">Loading logs...</div>
                    ) : activeTab === 'webhook' ? (
                        <WebhookTable logs={webhookLogs} />
                    ) : (
                        <ActivityTable logs={activityLogs} />
                    )}
                </div>
            </div>
        </div>
    )
}

function WebhookTable({ logs }: { logs: WebhookLog[] }) {
    if (logs.length === 0) {
        return <div className="p-12 text-center text-neutral-500">No webhook logs found.</div>
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <tr>
                    <th className="px-6 py-3 border-b border-neutral-200">Source</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Status</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Payload Sample</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Date</th>
                    <th className="px-6 py-3 border-b border-neutral-200"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 capitalize">{log.source}</td>
                        <td className="px-6 py-4">
                            {log.status === 'success' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Success
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Failed
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-500 max-w-xs truncate">
                            {JSON.stringify(log.payload)}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                            {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-neutral-400 hover:text-neutral-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function ActivityTable({ logs }: { logs: ActivityLog[] }) {
    if (logs.length === 0) {
        return <div className="p-12 text-center text-neutral-500">No activity logs found.</div>
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <tr>
                    <th className="px-6 py-3 border-b border-neutral-200">Lead</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Action</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Description</th>
                    <th className="px-6 py-3 border-b border-neutral-200">Date</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                            {log.lead.firstName} {log.lead.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-600 uppercase text-[10px] tracking-widest bg-primary-50/30 rounded inline-block px-2 py-0.5 my-2 mx-6">
                            {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{log.description}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                            {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
