'use client'

import { ShieldCheck, AlertCircle, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

export function DemoBanner() {
    const [isDemoMode, setIsDemoMode] = useState(false)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const checkDemoMode = async () => {
            try {
                const res = await fetch('/api/config')
                const data = (await res.json()) as any
                // Default to true for this demo-focused branch, 
                // but check the database flag specifically
                setIsDemoMode(data.configs?.['DEMO_MODE'] !== 'false')
            } catch (error) {
                console.error('Failed to check demo mode:', error)
                // Fallback to true since this is a demo environment
                setIsDemoMode(true)
            }
        }
        checkDemoMode()
    }, [])

    if (!isDemoMode || !isVisible) return null

    return (
        <div className="bg-primary-600 text-white px-4 py-2 flex items-center justify-between shadow-lg relative overflow-hidden transition-all duration-500 animate-in slide-in-from-top fill-mode-forwards">
            {/* Animated Background Pulse */}
            <div className="absolute inset-0 bg-primary-500 opacity-20 animate-pulse" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="p-1 bg-white/20 rounded-md backdrop-blur-sm">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-xs font-black uppercase tracking-widest bg-white text-primary-600 px-1.5 py-0.5 rounded">
                        Demo Mode Active
                    </span>
                    <p className="text-sm font-medium opacity-90">
                        Intelligent Decision Platform • <span className="opacity-75 italic">All outreach activity is simulated for safety.</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    title="Dismiss for this session"
                >
                    <AlertCircle className="w-4 h-4" />
                </button>
            </div>

            <style jsx>{`
                @keyframes slide-in-from-top {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
