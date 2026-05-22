'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Plus, X, Loader2, Users, PlugZap, Play } from 'lucide-react'
import { LeadCard } from '@/components/leads/LeadCard'
import { useDemoInjector } from '@/components/dashboard/DemoInjector'
import type { LeadSource, LeadStatus } from '@/lib/types'

interface Lead {
    id: string
    fullName: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    source: LeadSource
    status: LeadStatus
    score: number
    createdAt: string
}

export default function LeadsPage() {
    const router = useRouter()
    const { injectDemoLead, isInjecting: isGeneratingDemo } = useDemoInjector()
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all')
    const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

    // Add Lead Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newLead, setNewLead] = useState({
        full_name: '',
        email: '',
        phone: '',
        source: 'manual' as LeadSource,
        message: ''
    })

    useEffect(() => {
        fetchLeads()
    }, [sourceFilter, statusFilter])

    const fetchLeads = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (sourceFilter !== 'all') params.append('source', sourceFilter)
            if (statusFilter !== 'all') params.append('status', statusFilter)

            const response = await fetch(`/api/leads?${params.toString()}`)
            const data = await response.json()
            setLeads((data as any).leads || [])
        } catch (error) {
            console.error('Failed to fetch leads:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLead),
            })

            if (!response.ok) throw new Error('Failed to add lead')

            // Success
            setIsModalOpen(false)
            setNewLead({ full_name: '', email: '', phone: '', source: 'manual', message: '' })
            fetchLeads() // Refresh list
        } catch (error) {
            console.error(error)
            alert('Failed to add lead. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredLeads = leads.filter((lead) => {
        const name = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase()
        const searchLower = search.toLowerCase()
        return (
            name.includes(searchLower) ||
            lead.email?.toLowerCase().includes(searchLower) ||
            lead.phone?.includes(search)
        )
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Leads</h1>
                    <p className="text-neutral-600 mt-1">
                        Manage and track all your leads in one place
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Lead
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search leads by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Source filter */}
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as LeadSource | 'all')}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Sources</option>
                        <option value="facebook">Facebook</option>
                        <option value="google_ads">Google Ads</option>
                        <option value="website">Website</option>
                        <option value="manual">Manual</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
            </div>

            {/* Leads grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
                            <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 mb-4">
                        <Users className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">No leads yet</h3>
                    <p className="mt-1 text-sm text-neutral-500 mb-6">
                        Get started by connecting a lead source or generating a demo lead.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard/integrations"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <PlugZap className="-ml-1 mr-2 w-4 h-4" />
                            Go to Integrations
                        </Link>
                        <button
                            onClick={injectDemoLead}
                            disabled={isGeneratingDemo}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {isGeneratingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="-ml-1 mr-2 w-4 h-4 text-amber-500" />}
                            {isGeneratingDemo ? 'Generating...' : 'Generate Demo Lead'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            id={lead.id}
                            name={`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}
                            email={lead.email || undefined}
                            phone={lead.phone || undefined}
                            source={lead.source}
                            status={lead.status}
                            score={lead.score}
                            createdAt={new Date(lead.createdAt)}
                            onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-neutral-600">Total Leads</p>
                        <p className="text-2xl font-bold text-neutral-900">{filteredLeads.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-600">New</p>
                        <p className="text-2xl font-bold text-primary-600">
                            {filteredLeads.filter((l) => l.status === 'new').length}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-600">Qualified</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {filteredLeads.filter((l) => l.status === 'qualified').length}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-600">Won</p>
                        <p className="text-2xl font-bold text-success-600">
                            {filteredLeads.filter((l) => l.status === 'won').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add Lead Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <h2 className="text-xl font-bold text-neutral-900">Add New Lead</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddLead} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newLead.full_name}
                                    onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-neutral-700">Email Address</label>
                                    <input
                                        type="email"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-neutral-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700">Source</label>
                                <select
                                    value={newLead.source}
                                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value as LeadSource })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                                >
                                    <option value="manual">Manual Entry</option>
                                    <option value="website">Website</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="google_ads">Google Ads</option>
                                    <option value="whatsapp">WhatsApp</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-neutral-700">Message / Notes</label>
                                <textarea
                                    value={newLead.message}
                                    onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                                    placeholder="Any additional details..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {isSubmitting ? 'Adding...' : 'Add Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
