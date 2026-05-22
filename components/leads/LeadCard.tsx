import { StatusBadge } from '../ui/StatusBadge'
import { ScoreBadge } from '../ui/ScoreBadge'
import { SourceBadge } from '../ui/SourceBadge'
import { formatDistanceToNow } from 'date-fns'
import type { LeadSource, LeadStatus } from '@/lib/types'

interface LeadCardProps {
    id: string
    name: string
    email?: string
    phone?: string
    source: LeadSource
    status: LeadStatus
    score: number
    createdAt: Date
    onClick?: () => void
}

export function LeadCard({
    id,
    name,
    email,
    phone,
    source,
    status,
    score,
    createdAt,
    onClick,
}: LeadCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                        {name || 'Unknown'}
                    </h3>
                    {email && (
                        <p className="text-sm text-neutral-600 mb-1">{email}</p>
                    )}
                    {phone && (
                        <p className="text-sm text-neutral-600">{phone}</p>
                    )}
                </div>
                <ScoreBadge score={score} showLabel={false} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <SourceBadge source={source} />
                <StatusBadge status={status} />
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                    Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
            </div>
        </div>
    )
}
