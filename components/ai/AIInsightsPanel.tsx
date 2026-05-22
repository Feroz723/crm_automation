import { Sparkles, Loader2, ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import { useState } from 'react'

interface AIInsightsPanelProps {
    leadId: string
    summary?: string
    urgency?: 'hot' | 'warm' | 'cold'
    objections?: string[]
    strategy?: string
    talkingPoints?: string[]
    // Phase 2: Explainable AI
    scoringReasoning?: string
    scoringFactors?: Record<string, number>
    intentReasoning?: string
    confidence?: number
    historicalContextUsed?: boolean
    isLoading?: boolean
    error?: string
}

const urgencyConfig = {
    hot: { label: 'Hot Lead', className: 'bg-danger-500 text-white' },
    warm: { label: 'Warm Lead', className: 'bg-warning-500 text-white' },
    cold: { label: 'Cold Lead', className: 'bg-primary-500 text-white' },
}

export function AIInsightsPanel({
    leadId,
    summary,
    urgency,
    objections,
    strategy,
    talkingPoints,
    scoringReasoning,
    scoringFactors,
    intentReasoning,
    confidence,
    historicalContextUsed,
    isLoading,
    error,
}: AIInsightsPanelProps) {
    const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null)
    const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({})

    const handleFeedback = async (insightType: string, feedback: 'correct' | 'incorrect') => {
        try {
            setSubmittingFeedback(insightType)
            await fetch(`/api/leads/${leadId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ insightType, feedback }),
            })
            setFeedbackSent(prev => ({ ...prev, [insightType]: true }))
        } catch (err) {
            console.error('Failed to send feedback:', err)
        } finally {
            setSubmittingFeedback(null)
        }
    }
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
                <div className="flex items-center justify-center gap-3 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-sm font-medium">Generating AI insights...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-danger-50 rounded-lg border border-danger-200 p-6">
                <p className="text-sm text-danger-700">{error}</p>
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-6">
                <p className="text-sm text-neutral-600">No AI insights available yet.</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-neutral-900">AI Intelligence</h3>
                </div>
                <div className="flex items-center gap-2">
                    {confidence !== undefined && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-purple-200 rounded-md shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                Confidence: {Math.round(confidence * 100)}%
                            </span>
                        </div>
                    )}
                    {urgency && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyConfig[urgency].className}`}>
                            {urgencyConfig[urgency].label}
                        </span>
                    )}
                </div>
            </div>

            {/* Explainable AI: Score Reasoning */}
            {(scoringReasoning || scoringFactors) && (
                <div className="bg-white/50 border border-purple-100 rounded-lg p-4 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-purple-700 uppercase tracking-tight">Why this score?</h4>
                        <div className="flex items-center gap-1">
                            {feedbackSent['scoring'] ? (
                                <span className="text-[10px] text-success-600 flex items-center gap-1 font-medium bg-success-50 px-2 py-0.5 rounded">
                                    <Check className="w-3 h-3" /> Feedback sent
                                </span>
                            ) : (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleFeedback('scoring', 'correct')}
                                        disabled={!!submittingFeedback}
                                        className="p-1 hover:bg-success-100 text-neutral-400 hover:text-success-600 rounded transition-colors"
                                        title="Accurate reasoning"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleFeedback('scoring', 'incorrect')}
                                        disabled={!!submittingFeedback}
                                        className="p-1 hover:bg-danger-100 text-neutral-400 hover:text-danger-600 rounded transition-colors"
                                        title="Inaccurate reasoning"
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {historicalContextUsed && (
                                <span className="text-[10px] text-purple-400 font-medium ml-1">Calibrated</span>
                            )}
                        </div>
                    </div>
                    {scoringReasoning && (
                        <p className="text-sm text-neutral-800 italic leading-relaxed">
                            "{scoringReasoning}"
                        </p>
                    )}
                    {scoringFactors && Object.keys(scoringFactors).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.entries(scoringFactors).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between px-2 py-1 bg-purple-50 rounded border border-purple-100">
                                    <span className="text-[11px] text-neutral-600 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className={`text-[11px] font-bold ${value >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                        {value >= 0 ? '+' : ''}{value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-neutral-700">Summary</h4>
                    {feedbackSent['summary'] ? (
                        <span className="text-[10px] text-success-600 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Verified
                        </span>
                    ) : (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleFeedback('summary', 'correct')}
                                className="p-1 hover:bg-success-100 text-neutral-400 hover:text-success-600 rounded"
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleFeedback('summary', 'incorrect')}
                                className="p-1 hover:bg-danger-100 text-neutral-400 hover:text-danger-600 rounded"
                            >
                                <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-sm text-neutral-900 leading-relaxed">{summary}</p>
                {intentReasoning && (
                    <p className="text-[11px] text-neutral-500 bg-white/40 p-2 rounded border border-neutral-100 italic">
                        <span className="font-semibold uppercase text-[10px] mr-1">Intent Logic:</span> {intentReasoning}
                    </p>
                )}
            </div>

            {/* Strategy */}
            {strategy && (
                <div className="group">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-neutral-700">Recommended Strategy</h4>
                        {feedbackSent['strategy'] ? (
                            <span className="text-[10px] text-success-600 font-medium">Verified</span>
                        ) : (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleFeedback('strategy', 'correct')}
                                    className="p-1 hover:bg-success-100 text-neutral-400 hover:text-success-600 rounded"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleFeedback('strategy', 'incorrect')}
                                    className="p-1 hover:bg-danger-100 text-neutral-400 hover:text-danger-600 rounded"
                                >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-neutral-900">{strategy}</p>
                </div>
            )}

            {/* Talking Points */}
            {talkingPoints && talkingPoints.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Key Talking Points</h4>
                    <ul className="space-y-2">
                        {talkingPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-neutral-900">
                                <span className="text-purple-600 mt-0.5">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Objections */}
            {objections && objections.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Potential Objections</h4>
                    <ul className="space-y-2">
                        {objections.map((objection, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-neutral-900">
                                <span className="text-warning-600 mt-0.5">⚠</span>
                                <span>{objection}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
