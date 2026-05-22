'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthChange } from '@/lib/firebase/client'
import {
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Zap,
    BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (!user) {
                router.push('/login')
                return
            }
            setUserEmail(user.email || 'Evaluator')
        })
        return () => unsubscribe()
    }, [router])

    const steps = [
        {
            id: 1,
            title: 'Account Ready',
            description: 'Your AI CRM workspace is fully provisioned and secure.',
            status: 'completed',
            icon: CheckCircle2,
            action: null
        },
        {
            id: 2,
            title: 'Connect Lead Sources',
            description: 'Forward leads from your website, Facebook, or generate a demo lead.',
            status: 'current',
            icon: Zap,
            action: (
                <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/integrations"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                        Integration Hub
                    </Link>
                    <Link
                        href="/dashboard/integrations"
                        className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50"
                    >
                        Try Demo Lead
                    </Link>
                </div>
            )
        },
        {
            id: 3,
            title: 'Watch AI Work',
            description: 'Every incoming lead is enriched, scored, and explained by Decision AI.',
            status: 'pending',
            icon: BarChart3,
            action: null
        }
    ]

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
                <div className="p-8 lg:p-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">
                            Welcome, {userEmail?.split('@')[0]}!
                        </h1>
                        <p className="text-neutral-600">
                            Your platform is live. Follow these steps to see it in action.
                        </p>
                    </div>

                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                        {steps.map((step, idx) => {
                            const Icon = step.icon
                            const isCompleted = step.status === 'completed'
                            const isCurrent = step.status === 'current'

                            return (
                                <div key={step.id} className="relative flex items-start group">
                                    <div className={`absolute flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow ${isCompleted ? 'bg-emerald-500 text-white' :
                                            isCurrent ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold text-sm">{step.id}</span>}
                                    </div>
                                    <div className="ml-16 w-full">
                                        <h3 className={`font-bold text-lg ${isCurrent ? 'text-primary-700' : 'text-neutral-900'}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-neutral-500 mt-1 leading-relaxed">
                                            {step.description}
                                        </p>
                                        {step.action && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-left-4 duration-500">
                                                {step.action}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Multi-Tenant Node: <b>global-demo-org</b></span>
                    <Link
                        href="/dashboard"
                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center group"
                    >
                        Skip to Dashboard <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
