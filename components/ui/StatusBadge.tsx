import { LeadStatus } from '@/lib/types'

interface StatusBadgeProps {
    status: LeadStatus
    className?: string
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
    new: {
        label: 'New',
        className: 'bg-primary-100 text-primary-700 border-primary-200',
    },
    contacted: {
        label: 'Contacted',
        className: 'bg-warning-100 text-warning-700 border-warning-200',
    },
    qualified: {
        label: 'Qualified',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    proposal: {
        label: 'Proposal',
        className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    won: {
        label: 'Won',
        className: 'bg-success-100 text-success-700 border-success-200',
    },
    lost: {
        label: 'Lost',
        className: 'bg-danger-100 text-danger-700 border-danger-200',
    },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const config = statusConfig[status] || {
        label: status || 'Unknown',
        className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    }

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
        >
            {config.label}
        </span>
    )
}
