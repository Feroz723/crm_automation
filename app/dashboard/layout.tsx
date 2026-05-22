'use client'

import { useEffect, useState } from 'react'
import { onAuthChange, firebaseSignOut } from '@/lib/firebase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Users,
    GitBranch,
    BarChart3,
    Settings,
    FileText,
    Menu,
    X,
    LogOut,
    PlugZap
} from 'lucide-react'
import { DemoBanner } from '@/components/dashboard/DemoBanner'

const navigation = [
    { name: 'Leads', href: '/dashboard/leads', icon: Users },
    { name: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
    { name: 'Integrations', href: '/dashboard/integrations', icon: PlugZap },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Logs', href: '/dashboard/logs', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            if (user) {
                setUserEmail(user.email || null)
            }
        })
        return () => unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await firebaseSignOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50 font-sans">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop & Mobile Hybrid */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200
                    transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 flex-shrink-0">
                        <Link href="/dashboard/leads" className="flex items-center space-x-2">
                            <LayoutDashboard className="w-6 h-6 text-primary-600" />
                            <span className="font-bold text-lg">AI Lead CRM</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-neutral-500 hover:text-neutral-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-neutral-700 hover:bg-neutral-100'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-neutral-200 flex-shrink-0">
                        <div className="flex flex-col space-y-4 px-4 py-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {(userEmail?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 truncate">{userEmail || 'Loading...'}</p>
                                    <p className="text-xs text-neutral-500">Academic Evaluator</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="whitespace-nowrap">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Column */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Banner sits here so it pushes content down and respects sidebar width */}
                <DemoBanner />

                <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-neutral-500 hover:text-neutral-700"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-neutral-600">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
