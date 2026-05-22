'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, MessageSquare, Send, Copy, Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Zap, Play, Clock, CheckCircle, Info } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { TimelineItem } from '@/components/leads/TimelineItem'
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel'
import { isLeadReadyForOutreach } from '@/lib/outreach'
import type { LeadStatus } from '@/lib/types'

export default function LeadDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [lead, setLead] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [generatingEmails, setGeneratingEmails] = useState(false)
    const [generatingDraft, setGeneratingDraft] = useState(false)
    const [approvingDraft, setApprovingDraft] = useState(false)
    const [approvingPlan, setApprovingPlan] = useState(false)
    const [emails, setEmails] = useState<any[]>([])
    const [aiInsights, setAiInsights] = useState<any>(null)

    useEffect(() => {
        fetchLead()
    }, [params.id])

    const fetchLead = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/leads/${params.id}`)
            const data = (await response.json()) as any
            setLead(data.lead)

            // Extract AI insights from activities
            const summaryActivity = data.lead.activities?.find((a: any) => a.type === 'ai_summary')
            if (summaryActivity?.metadata) {
                setAiInsights(summaryActivity.metadata)
            }
        } catch (error) {
            console.error('Failed to fetch lead:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApproveAutomationPlan = async () => {
        try {
            setApprovingPlan(true)
            const response = await fetch(`/api/leads/${params.id}/automation/approve`, {
                method: 'POST'
            })
            if (response.ok) {
                fetchLead()
            }
        } catch (error) {
            console.error('Failed to approve automation plan:', error)
        } finally {
            setApprovingPlan(false)
        }
    }

    const handleRejectAutomationPlan = async () => {
        const reason = prompt('Please provide a reason for rejecting this automation sequence:')
        if (reason === null) return // Cancelled

        try {
            const response = await fetch(`/api/leads/${params.id}/automation/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })
            if (response.ok) {
                fetchLead()
            }
        } catch (error) {
            console.error('Failed to reject automation plan:', error)
        }
    }

    const handleApproveDraft = async () => {
        try {
            setApprovingDraft(true)
            const response = await fetch(`/api/leads/${params.id}/outreach-draft/approve`, {
                method: 'POST'
            })
            if (response.ok) {
                fetchLead()
            }
        } catch (error) {
            console.error('Failed to approve draft:', error)
        } finally {
            setApprovingDraft(false)
        }
    }

    const handleRejectDraft = async () => {
        if (!confirm('Are you sure you want to discard this AI draft?')) return
        try {
            const response = await fetch(`/api/leads/${params.id}/outreach-draft/reject`, {
                method: 'POST'
            })
            if (response.ok) {
                fetchLead()
            }
        } catch (error) {
            console.error('Failed to reject draft:', error)
        }
    }

    const handleReviewStatusChange = async (newReviewStatus: string) => {
        try {
            await fetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewStatus: newReviewStatus }),
            })
            fetchLead()
        } catch (error) {
            console.error('Failed to update review status:', error)
        }
    }

    const handleStatusChange = async (newStatus: LeadStatus) => {
        try {
            await fetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            fetchLead()
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const handleSyncToCRM = async () => {
        try {
            setSyncing(true)
            await fetch('/api/crm/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: params.id }),
            })
            fetchLead()
        } catch (error) {
            console.error('Failed to sync to CRM:', error)
        } finally {
            setSyncing(false)
        }
    }

    const handleGenerateOutreachDraft = async () => {
        try {
            setGeneratingDraft(true)
            const response = await fetch(`/api/leads/${params.id}/outreach-draft`, {
                method: 'POST',
            })
            const data = (await response.json()) as any
            if (response.ok) {
                fetchLead() // Refresh to get the draft
            } else {
                alert(data.error || 'Failed to generate draft')
            }
        } catch (error) {
            console.error('Failed to generate draft:', error)
        } finally {
            setGeneratingDraft(false)
        }
    }

    const handleUpdateDraft = async (updatedDraftContent: any) => {
        try {
            await fetch(`/api/leads/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outreachDraft: {
                        ...lead.outreachDraft,
                        email: {
                            ...lead.outreachDraft.email,
                            body: updatedDraftContent
                        }
                    }
                }),
            })
            fetchLead()
        } catch (error) {
            console.error('Failed to update draft:', error)
        }
    }

    const handleGenerateEmails = async () => {
        try {
            setGeneratingEmails(true)
            const response = await fetch(`/api/leads/${params.id}/emails`, {
                method: 'POST',
            })
            const data = (await response.json()) as any
            setEmails(data.emails || [])
        } catch (error) {
            console.error('Failed to generate emails:', error)
        } finally {
            setGeneratingEmails(false)
        }
    }

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!lead) {
        return <div>Lead not found</div>
    }

    const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Leads
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">{name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            {lead.email && (
                                <div className="flex items-center gap-2 text-neutral-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{lead.email}</span>
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center gap-2 text-neutral-600">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">{lead.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <ScoreBadge score={lead.score} />
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <SourceBadge source={lead.source} />
                    <StatusBadge status={lead.status} />
                </div>
            </div>

            {/* Phase 2.5: Intelligence Validation Bar */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${lead.reviewStatus === 'verified' ? 'bg-success-50 border-success-200' :
                lead.reviewStatus === 'rejected' ? 'bg-danger-50 border-danger-200' :
                    'bg-primary-50 border-primary-100 shadow-sm'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${lead.reviewStatus === 'verified' ? 'bg-success-100 text-success-600' :
                        lead.reviewStatus === 'rejected' ? 'bg-danger-100 text-danger-600' :
                            'bg-primary-100 text-primary-600'
                        }`}>
                        {lead.reviewStatus === 'verified' ? <ShieldCheck className="w-5 h-5" /> :
                            lead.reviewStatus === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                                Intelligence Validation
                            </h3>
                            {isLeadReadyForOutreach(lead).isReady && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-success-600 text-white text-[9px] font-black uppercase rounded animate-pulse">
                                    Ready for Delivery
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-600">
                            {lead.reviewStatus === 'unreviewed' ? 'Review AI insights and confirm if they are accurate before automation.' :
                                lead.reviewStatus === 'verified' ? (
                                    isLeadReadyForOutreach(lead).isReady
                                        ? 'All safety checks passed. Lead is primed for outreach.'
                                        : `Verified, but missing: ${isLeadReadyForOutreach(lead).missing?.join(', ')}`
                                ) :
                                    'AI evaluation has been rejected or corrected by a human.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => handleReviewStatusChange('verified')}
                        disabled={lead.reviewStatus === 'verified'}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${lead.reviewStatus === 'verified'
                            ? 'bg-success-600 text-white shadow-lg shadow-success-200/50'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:border-success-300 hover:text-success-600 shadow-sm'
                            }`}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify
                    </button>
                    <button
                        onClick={() => handleReviewStatusChange('rejected')}
                        disabled={lead.reviewStatus === 'rejected'}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${lead.reviewStatus === 'rejected'
                            ? 'bg-danger-600 text-white shadow-lg shadow-danger-200/50'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:border-danger-300 hover:text-danger-600 shadow-sm'
                            }`}
                    >
                        <XCircle className="w-4 h-4" />
                        Reject
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Insights */}
                    <AIInsightsPanel
                        leadId={lead.id}
                        summary={aiInsights?.summary}
                        urgency={aiInsights?.urgency}
                        objections={aiInsights?.objections}
                        strategy={aiInsights?.strategy}
                        talkingPoints={aiInsights?.talkingPoints}
                        // Phase 2: Explainable AI
                        scoringReasoning={lead.aiMetadata?.scoringReasoning}
                        scoringFactors={lead.aiMetadata?.scoringFactors}
                        intentReasoning={lead.aiMetadata?.intentReasoning}
                        confidence={lead.aiMetadata?.confidence}
                        historicalContextUsed={lead.aiMetadata?.historicalContextUsed}
                    />

                    {/* Phase 3.0: AI Outreach Draft */}
                    {lead.reviewStatus === 'verified' && (
                        <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Send className="w-5 h-5 text-primary-600" />
                                    <h2 className="font-semibold text-lg">AI Outreach Draft</h2>
                                </div>
                                <button
                                    onClick={handleGenerateOutreachDraft}
                                    disabled={generatingDraft || (lead.aiMetadata?.confidence < 0.85)}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 flex items-center gap-1"
                                    title={lead.aiMetadata?.confidence < 0.85 ? "Confidence too low for auto-drafting" : "Regenerate new draft"}
                                >
                                    {generatingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    {lead.outreachDraft ? 'Regenerate Draft' : 'Generate Draft'}
                                </button>
                            </div>

                            {lead.outreachDraft ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.outreachDraft.email.tone === 'formal' ? 'bg-neutral-100 text-neutral-600' :
                                                lead.outreachDraft.email.tone === 'friendly' ? 'bg-primary-50 text-primary-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                {lead.outreachDraft.email.tone}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.outreachDraft.email.status === 'approved' ? 'bg-success-100 text-success-700' :
                                                lead.outreachDraft.email.status === 'rejected' ? 'bg-danger-100 text-danger-700' :
                                                    'bg-warning-100 text-warning-700'
                                                }`}>
                                                {lead.outreachDraft.email.status}
                                            </span>
                                            <span className="text-[10px] text-neutral-400">
                                                Generated {new Date(lead.outreachDraft.email.generatedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {lead.outreachDraft.email.status === 'approved' && (
                                            <div className="flex items-center gap-1 text-success-600 text-[10px] font-bold">
                                                <ShieldCheck className="w-3 h-3" />
                                                APPROVED AT {new Date(lead.outreachDraft.email.approvedAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">Subject</label>
                                        <div className="px-3 py-2 bg-neutral-50 border border-neutral-100 rounded text-sm font-medium text-neutral-700">
                                            {lead.outreachDraft.email.subject}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block">Body</label>
                                        <textarea
                                            value={lead.outreachDraft.email.body}
                                            onChange={(e) => handleUpdateDraft(e.target.value)}
                                            rows={8}
                                            disabled={lead.outreachDraft.email.status === 'approved'}
                                            className={`w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all resize-none leading-relaxed ${lead.outreachDraft.email.status === 'approved' ? 'opacity-70 bg-neutral-50 cursor-not-allowed' : ''
                                                }`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <button
                                            onClick={handleRejectDraft}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg font-bold text-sm hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200 transition-all"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Discard Draft
                                        </button>
                                        <button
                                            onClick={handleApproveDraft}
                                            disabled={approvingDraft || lead.outreachDraft.email.status === 'approved'}
                                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${lead.outreachDraft.email.status === 'approved'
                                                ? 'bg-success-600 text-white shadow-success-200'
                                                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
                                                } disabled:opacity-50`}
                                        >
                                            {approvingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            {lead.outreachDraft.email.status === 'approved' ? 'Draft Approved' : 'Approve for Sending'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-neutral-100 rounded-lg bg-neutral-50/50">
                                    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                        <Zap className="w-6 h-6 text-neutral-300" />
                                    </div>
                                    <p className="text-sm text-neutral-500 text-center max-w-[250px]">
                                        {lead.aiMetadata?.confidence < 0.85
                                            ? "AI confidence is too low to auto-generate a draft for this lead."
                                            : "No draft has been generated yet for this verified lead."}
                                    </p>
                                    {lead.aiMetadata?.confidence >= 0.85 && (
                                        <button
                                            onClick={handleGenerateOutreachDraft}
                                            disabled={generatingDraft}
                                            className="mt-4 px-4 py-2 bg-white text-primary-600 border border-primary-200 rounded-lg text-sm font-bold hover:bg-primary-50 transition-colors shadow-sm"
                                        >
                                            Generate Initial Draft
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Milestone 3: Automation Simulation Review */}
                    {lead.automationStatus !== 'not_simulated' && (
                        <div className={`rounded-xl border p-6 transition-all ${lead.automationStatus === 'approved' ? 'bg-success-50 border-success-200' :
                                lead.automationStatus === 'rejected' ? 'bg-danger-50 border-danger-200' :
                                    'bg-neutral-900 border-neutral-800 text-white shadow-xl'
                            }`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${lead.automationStatus === 'approved' ? 'bg-success-100 text-success-600' :
                                            lead.automationStatus === 'rejected' ? 'bg-danger-100 text-danger-600' :
                                                'bg-primary-500 text-white'
                                        }`}>
                                        <Play className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className={`font-bold text-lg ${lead.automationStatus === 'simulated' ? 'text-white' : 'text-neutral-900'}`}>
                                            Automation Simulation Review
                                        </h2>
                                        <p className={`text-xs ${lead.automationStatus === 'simulated' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                            {lead.automationStatus === 'simulated' ? 'INTERNAL DRY-RUN: No actions have been taken yet.' :
                                                lead.automationStatus === 'approved' ? 'Simulation Approved. Ready for live integration.' :
                                                    'Simulation Rejected. Adjustments required.'}
                                        </p>
                                    </div>
                                </div>
                                {lead.automationStatus === 'simulated' && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                        <Info className="w-3 h-3" />
                                        Simulation Mode
                                    </div>
                                )}
                            </div>

                            {/* Simulated Steps */}
                            <div className="space-y-4 mb-8">
                                {lead.activities
                                    ?.filter((a: any) => a.type === 'automation_simulation')
                                    .map((sim: any, idx: number) => (
                                        <div key={idx} className={`p-4 rounded-lg border flex items-start gap-4 ${lead.automationStatus === 'simulated'
                                                ? 'bg-neutral-800/50 border-neutral-700'
                                                : 'bg-white border-neutral-100'
                                            }`}>
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`text-sm font-bold capitalize ${lead.automationStatus === 'simulated' ? 'text-white' : 'text-neutral-900'}`}>
                                                        {sim.metadata?.action.replace('_', ' ')}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(sim.metadata?.scheduledFor).toLocaleTimeString()}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-success-500/10 text-success-500 text-[9px] font-bold uppercase tracking-tight border border-success-500/20">
                                                            {sim.metadata?.simulatedStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-neutral-500 mb-2 italic">
                                                    Channel: {sim.metadata?.channel}
                                                </p>
                                                <div className={`p-2 rounded text-[10px] font-mono whitespace-pre-wrap overflow-hidden ${lead.automationStatus === 'simulated' ? 'bg-black/20 text-neutral-400' : 'bg-neutral-50 text-neutral-600'
                                                    }`}>
                                                    Payload: {sim.metadata?.payloadPreview}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Decision Controls */}
                            {lead.automationStatus === 'simulated' && (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleRejectAutomationPlan}
                                        className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-danger-900/40 text-neutral-400 hover:text-danger-400 border border-neutral-700 hover:border-danger-900/50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject Sequence
                                    </button>
                                    <button
                                        onClick={handleApproveAutomationPlan}
                                        disabled={approvingPlan}
                                        className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
                                    >
                                        {approvingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve Simulation
                                    </button>
                                </div>
                            )}

                            {lead.automationStatus === 'approved' && (
                                <div className="flex items-center justify-center gap-2 py-2 text-success-600 font-bold text-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                    Simulation Logic Approved by Human
                                </div>
                            )}

                            {lead.automationStatus === 'rejected' && (
                                <div className="flex flex-col items-center gap-2 py-2 text-danger-600 font-bold text-sm">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        Simulation Rejected
                                    </div>
                                    <p className="text-xs font-normal text-danger-500">
                                        Please regenerate the outreach draft to restart the simulation.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Actions */}
                    <div className="bg-white rounded-lg border border-neutral-200 p-6">
                        <h2 className="font-semibold text-lg mb-4">Update Status</h2>
                        <div className="flex flex-wrap gap-2">
                            {(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as LeadStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={lead.status === status}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${lead.status === status
                                        ? 'bg-primary-100 text-primary-700 cursor-not-allowed'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Generator */}
                    <div className="bg-white rounded-lg border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">AI Email Generator</h2>
                            <button
                                onClick={handleGenerateEmails}
                                disabled={generatingEmails}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {generatingEmails ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Generate Emails</>
                                )}
                            </button>
                        </div>

                        {emails.length > 0 && (
                            <div className="space-y-4">
                                {emails.map((email, index) => (
                                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium capitalize">{email.variant}</h3>
                                            <button
                                                onClick={() => handleCopyEmail(`${email.subject}\n\n${email.body}`)}
                                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium text-neutral-700 mb-2">
                                            Subject: {email.subject}
                                        </p>
                                        <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                            {email.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-lg border border-neutral-200 p-6">
                        <h2 className="font-semibold text-lg mb-6">Activity Timeline</h2>
                        <div className="space-y-4">
                            {lead.activities?.length > 0 ? (
                                lead.activities.map((activity: any) => (
                                    <TimelineItem
                                        key={activity.id}
                                        type={activity.type}
                                        description={activity.description}
                                        createdAt={new Date(activity.createdAt)}
                                        metadata={activity.metadata}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-neutral-600">No activities yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* CRM Sync */}
                    <div className="bg-white rounded-lg border border-neutral-200 p-6">
                        <h2 className="font-semibold text-lg mb-4">CRM Sync</h2>
                        <button
                            onClick={handleSyncToCRM}
                            disabled={syncing}
                            className="w-full px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {syncing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                            ) : (
                                <>Sync to HubSpot</>
                            )}
                        </button>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-lg border border-neutral-200 p-6">
                        <h2 className="font-semibold text-lg mb-4">Notes</h2>
                        <div className="space-y-3">
                            {lead.notes ? (
                                <p className="text-sm text-neutral-700">{lead.notes}</p>
                            ) : (
                                <p className="text-sm text-neutral-500">No notes available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
