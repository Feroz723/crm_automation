interface ScoreBadgeProps {
    score: number
    showLabel?: boolean
    className?: string
}

export function ScoreBadge({ score, showLabel = true, className = '' }: ScoreBadgeProps) {
    // Determine color based on score
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-success-500 text-white'
        if (score >= 60) return 'bg-success-400 text-white'
        if (score >= 40) return 'bg-warning-500 text-white'
        if (score >= 20) return 'bg-warning-600 text-white'
        return 'bg-danger-500 text-white'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        if (score >= 40) return 'Fair'
        if (score >= 20) return 'Low'
        return 'Very Low'
    }

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold ${getScoreColor(
                    score
                )}`}
            >
                {score}
            </span>
            {showLabel && (
                <span className="text-sm text-neutral-600 font-medium">
                    {getScoreLabel(score)}
                </span>
            )}
        </div>
    )
}
