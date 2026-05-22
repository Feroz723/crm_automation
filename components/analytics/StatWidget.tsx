import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatWidgetProps {
    label: string
    value: string | number
    trend?: number // percentage change
    icon?: React.ReactNode
    className?: string
}

export function StatWidget({ label, value, trend, icon, className = '' }: StatWidgetProps) {
    const getTrendIcon = () => {
        if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />
        return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
    }

    const getTrendColor = () => {
        if (trend === undefined || trend === 0) return 'text-neutral-500'
        return trend > 0 ? 'text-success-600' : 'text-danger-600'
    }

    return (
        <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-600">{label}</p>
                {icon && <div className="text-neutral-400">{icon}</div>}
            </div>

            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-neutral-900">{value}</p>

                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
        </div>
    )
}
