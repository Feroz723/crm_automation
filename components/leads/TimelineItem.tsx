import { formatDistanceToNow } from 'date-fns'
import {
    User,
    Mail,
    Phone,
    MessageSquare,
    TrendingUp,
    Zap,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    MessageSquareQuote,
    Settings2,
    Send,
    Play,
    Activity
} from 'lucide-react'
import type { ActivityType } from '@/lib/types'

interface TimelineItemProps {
    type: ActivityType
    description: string
    createdAt: Date
    metadata?: any
}

const activityConfig: Record<ActivityType, { icon: any; className: string }> = {
    status_change: {
        icon: TrendingUp,
        className: 'bg-primary-100 text-primary-600',
    },
    email_sent: {
        icon: Mail,
        className: 'bg-blue-100 text-blue-600',
    },
    ai_summary: {
        icon: Zap,
        className: 'bg-purple-100 text-purple-600',
    },
    crm_sync: {
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-600',
    },
    note: {
        icon: MessageSquare,
        className: 'bg-neutral-100 text-neutral-600',
    },
    enrichment: {
        icon: Zap,
        className: 'bg-indigo-100 text-indigo-600',
    },
    score_calculated: {
        icon: TrendingUp,
        className: 'bg-warning-100 text-warning-600',
    },
    ai_feedback: {
        icon: MessageSquareQuote,
        className: 'bg-purple-100 text-purple-600',
    },
    manual_override: {
        icon: User,
        className: 'bg-amber-100 text-amber-600',
    },
    review_status_change: {
        icon: ShieldCheck,
        className: 'bg-success-100 text-success-600',
    },
    outreach_draft_generated: {
        icon: Send,
        className: 'bg-indigo-100 text-indigo-600',
    },
    outreach_draft_regenerated: {
        icon: Zap,
        className: 'bg-purple-100 text-purple-600',
    },
    outreach_draft_approved: {
        icon: ShieldCheck,
        className: 'bg-success-100 text-success-600',
    },
    outreach_draft_rejected: {
        icon: XCircle,
        className: 'bg-danger-100 text-danger-600',
    },
    automation_simulation: {
        icon: Play,
        className: 'bg-neutral-800 text-white',
    },
    automation_plan_approved: {
        icon: ShieldCheck,
        className: 'bg-success-100 text-success-600',
    },
    automation_plan_rejected: {
        icon: XCircle,
        className: 'bg-danger-100 text-danger-600',
    },
    delivery_result: {
        icon: Activity,
        className: 'bg-black text-white',
    },
}

export function TimelineItem({ type, description, createdAt, metadata }: TimelineItemProps) {
    const config = activityConfig[type]
    const Icon = config.icon

    return (
        <div className="flex gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.className}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 pb-8">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 capitalize">
                            {type.replace('_', ' ')}
                        </p>
                        {type === 'automation_simulation' && (
                            <span className="px-1.5 py-0.5 bg-neutral-900 text-white text-[8px] font-black uppercase rounded tracking-tighter">
                                Dry Run
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </p>
                </div>

                <p className="text-sm text-neutral-700">
                    {description}
                </p>

                {metadata && (
                    <details className="mt-2">
                        <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-700">
                            View details
                        </summary>
                        <pre className="mt-2 text-xs bg-neutral-50 p-3 rounded border border-neutral-200 overflow-x-auto">
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    )
}
