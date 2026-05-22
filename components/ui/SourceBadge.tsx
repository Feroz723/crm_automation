import { LeadSource } from '@/lib/types'
import { Facebook, Globe, Mail, MessageSquare, Search, Zap } from 'lucide-react'

interface SourceBadgeProps {
    source: LeadSource
    className?: string
}

const sourceConfig: Record<string, { label: string; icon: any; className: string }> = {
    facebook: {
        label: 'Facebook',
        icon: Facebook,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    google_ads: {
        label: 'Google Ads',
        icon: Search,
        className: 'bg-red-100 text-red-700 border-red-200',
    },
    website: {
        label: 'Website',
        icon: Globe,
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    manual: {
        label: 'Manual',
        icon: Mail,
        className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    },
    whatsapp: {
        label: 'WhatsApp',
        icon: MessageSquare,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    n8n: {
        label: 'n8n Automation',
        icon: Zap,
        className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
}

const defaultSource = {
    label: 'Other',
    icon: Globe,
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
    const config = sourceConfig[source as string] || defaultSource
    const Icon = config.icon

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
        >
            <Icon className="w-3 h-3" />
            {sourceConfig[source as string] ? config.label : source}
        </span>
    )
}
