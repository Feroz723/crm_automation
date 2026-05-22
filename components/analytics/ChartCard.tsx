import { Download } from 'lucide-react'

interface ChartCardProps {
    title: string
    description?: string
    children: React.ReactNode
    onExport?: () => void
    className?: string
}

export function ChartCard({
    title,
    description,
    children,
    onExport,
    className = ''
}: ChartCardProps) {
    return (
        <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                    {description && (
                        <p className="text-sm text-neutral-600 mt-1">{description}</p>
                    )}
                </div>

                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                )}
            </div>

            <div>{children}</div>
        </div>
    )
}
