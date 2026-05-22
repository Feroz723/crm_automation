"use client"

import React, { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus, MoreVertical, GripVertical, Loader2, Zap, ChevronDown } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import type { LeadStatus } from '@/lib/types'

interface Lead {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    source: string
    status: LeadStatus
    score: number
}

interface Column {
    id: LeadStatus;
    title: string;
}

const COLUMNS: Column[] = [
    { id: 'new', title: 'New Leads' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'proposal', title: 'Proposal' },
    { id: 'won', title: 'Won' },
    { id: 'lost', title: 'Lost' },
]

export default function PipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [generatingDemo, setGeneratingDemo] = useState<string | null>(null)

    useEffect(() => {
        fetchLeads()
    }, [])

    const handleGenerateDemo = async (scenario: 'enterprise' | 'smb' | 'junk') => {
        try {
            setGeneratingDemo(scenario)
            const res = await fetch('/api/demo/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            })
            if (res.ok) {
                await fetchLeads()
            }
        } catch (error) {
            console.error('Failed to generate demo lead:', error)
        } finally {
            setGeneratingDemo(null)
        }
    }

    const fetchLeads = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/leads?limit=100')
            const data = await response.json() as any
            if (data && data.leads) {
                setLeads(data.leads as Lead[])
            } else if (Array.isArray(data)) {
                setLeads(data as Lead[])
            } else {
                setLeads([])
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error)
            setLeads([])
        } finally {
            setLoading(false)
        }
    }

    const moveLead = async (leadId: string, newStatus: LeadStatus) => {
        // Optimistic update
        const previousLeads = [...leads]
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

        try {
            const response = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!response.ok) throw new Error('Failed to update lead status')
        } catch (error) {
            console.error(error)
            setLeads(previousLeads) // Rollback on error
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Pipeline</h1>
                        <p className="text-neutral-600 mt-1">Manage your sales funnel with drag and drop</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="group relative">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm shadow-indigo-200">
                                <Zap className="w-4 h-4" />
                                <span>Inject AI Scenario</span>
                                <ChevronDown className="w-4 h-4 opacity-70" />
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50 p-2">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 py-2">Select Scenario</p>
                                <DemoScenarioButton
                                    label="Enterprise Whale"
                                    description="High-value, complex needs"
                                    onClick={() => handleGenerateDemo('enterprise')}
                                    loading={generatingDemo === 'enterprise'}
                                />
                                <DemoScenarioButton
                                    label="Small Business"
                                    description="Standard outreach needs"
                                    onClick={() => handleGenerateDemo('smb')}
                                    loading={generatingDemo === 'smb'}
                                />
                                <DemoScenarioButton
                                    label="Junk / Incomplete"
                                    description="Test rejection logic"
                                    onClick={() => handleGenerateDemo('junk')}
                                    loading={generatingDemo === 'junk'}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
                    {COLUMNS.map(column => (
                        <PipelineColumn
                            key={column.id}
                            column={column}
                            leads={leads.filter(l => l.status === column.id)}
                            onDropLead={(leadId) => moveLead(leadId, column.id)}
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    )
}

function PipelineColumn({ column, leads, onDropLead }: { column: Column, leads: Lead[], onDropLead: (id: string) => void }) {
    const [{ isOver }, drop] = useDrop({
        accept: 'LEAD',
        drop: (item: { id: string }) => onDropLead(item.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    })

    return (
        <div
            ref={drop as any}
            className={`flex-shrink-0 w-80 rounded-xl border flex flex-col max-h-[calc(100vh-250px)] ${isOver ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50/50 border-neutral-200'
                }`}
        >
            <div className="p-4 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-neutral-900">{column.title}</h2>
                    <span className="text-xs font-medium px-2 py-0.5 bg-white border border-neutral-200 rounded-full text-neutral-500">
                        {leads.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
                {leads.map(lead => (
                    <PipelineCard key={lead.id} lead={lead} />
                ))}
            </div>
        </div>
    )
}

function PipelineCard({ lead }: { lead: Lead }) {
    const [{ isDragging }, drag] = useDrag({
        type: 'LEAD',
        item: { id: lead.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    })

    return (
        <div
            ref={drag as any}
            className={`bg-white p-4 rounded-lg border border-neutral-200 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 grayscale scale-95' : 'opacity-100'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-neutral-900 text-sm truncate pr-2">
                    {lead.firstName} {lead.lastName}
                </h3>
                <button className="text-neutral-400 hover:text-neutral-600">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-neutral-500 mb-3 truncate">{lead.email || 'No email'}</p>

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100">
                <ScoreBadge score={lead.score} />
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{lead.source}</span>
            </div>
        </div>
    )
}

function DemoScenarioButton({ label, description, onClick, loading }: { label: string, description: string, onClick: () => void, loading: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors text-left group/btn"
        >
            <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900 group-hover/btn:text-indigo-600 transition-colors">{label}</p>
                <p className="text-[10px] text-neutral-500">{description}</p>
            </div>
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
                <Plus className="w-3 h-3 text-neutral-300 group-hover/btn:text-indigo-400 transition-colors" />
            )}
        </button>
    )
}
