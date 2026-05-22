'use client'

import { useState, useEffect } from 'react'
import { Save, User, Key, Bell, Globe, Database, ShieldCheck, Copy, Check, Info, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react'

type SettingsTab = 'general' | 'api' | 'security' | 'notifications' | 'database'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [configs, setConfigs] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/config')
            const data = (await res.json()) as any
            if (data.configs) setConfigs(data.configs)
        } catch (error) {
            console.error('Failed to fetch configs:', error)
        }
    }

    const updateConfig = async (key: string, value: string) => {
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            })
            fetchConfigs()
        } catch (error) {
            console.error(`Failed to update config ${key}:`, error)
        }
    }

    const handleSave = () => {
        setLoading(true)
        // Simulate save for other fields
        setTimeout(() => {
            setLoading(false)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }, 1000)
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
                <p className="text-neutral-600 mt-1">Configure your CRM and integration settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="space-y-1">
                    <SettingsNavItem
                        icon={<User className="w-4 h-4" />}
                        label="General Profile"
                        active={activeTab === 'general'}
                        onClick={() => setActiveTab('general')}
                    />
                    <SettingsNavItem
                        icon={<Key className="w-4 h-4" />}
                        label="API & Integrations"
                        active={activeTab === 'api'}
                        onClick={() => setActiveTab('api')}
                    />
                    <SettingsNavItem
                        icon={<ShieldCheck className="w-4 h-4" />}
                        label="Security"
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                    />
                    <SettingsNavItem
                        icon={<Bell className="w-4 h-4" />}
                        label="Notifications"
                        active={activeTab === 'notifications'}
                        onClick={() => setActiveTab('notifications')}
                    />
                    <SettingsNavItem
                        icon={<Database className="w-4 h-4" />}
                        label="Database"
                        active={activeTab === 'database'}
                        onClick={() => setActiveTab('database')}
                    />
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'api' && <ApiSettings />}
                    {activeTab === 'security' && <SecuritySettings configs={configs} updateConfig={updateConfig} />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'database' && <DatabaseSettings />}

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                        {success && <span className="text-sm text-green-600 font-medium animate-in fade-in">Settings saved!</span>}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-200"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function GeneralSettings() {
    return (
        <div className="space-y-6">
            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Application Configuration</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">App Name</label>
                            <input
                                type="text"
                                defaultValue="AI Lead Gen CRM"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Support Email</label>
                            <input
                                type="email"
                                defaultValue="support@ferozailead.com"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Webhook URL (Production)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value="https://api.ferozailead.com/webhook"
                                className="flex-1 px-4 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-neutral-500 text-sm"
                            />
                            <button className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium">Copy</button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">AI Service Preference</h2>
                <div className="space-y-4">
                    <ToggleButton label="Force AI Fallback" description="Always use Gemini instead of Groq" />
                    <ToggleButton label="Auto-Enrichment" description="Automatically enrich new leads on ingestion" defaultChecked />
                    <ToggleButton label="Smart Scoring" description="Use AI to calculate lead quality scores" defaultChecked />
                </div>
            </section>
        </div>
    )
}

function ApiSettings() {
    return (
        <div className="space-y-6">
            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <h2 className="text-lg font-semibold text-neutral-900">AI Service Keys</h2>
                    <Info className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="space-y-4">
                    <ApiKeyInput label="Groq API Key" value="gsk_************************" />
                    <ApiKeyInput label="Google Gemini API Key" value="AIza************************" />
                </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Auth Provider</h2>
                <div className="space-y-4">
                    <ApiKeyInput label="Firebase Project ID" value="your_project_id" />
                    <ApiKeyInput label="Firebase API Key" value="AIza************************" />
                </div>
            </section>
        </div>
    )
}

function SecuritySettings({ configs, updateConfig }: { configs: any, updateConfig: any }) {
    const isEmergencyStop = configs['EMERGENCY_STOP'] === 'true'

    return (
        <div className="space-y-6">
            <section className="bg-red-50 rounded-xl border border-red-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-900">Global Outreach Kill-Switch</h2>
                        <p className="text-sm text-red-700">Instantly halt all automated delivery activities across the CRM.</p>
                    </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${isEmergencyStop ? 'bg-red-600 border-red-700' : 'bg-white border-red-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-bold ${isEmergencyStop ? 'text-white' : 'text-neutral-900'}`}>Emergency Stop Status</p>
                            <p className={`text-sm ${isEmergencyStop ? 'text-red-100' : 'text-neutral-500'}`}>
                                {isEmergencyStop
                                    ? 'ACTIVE: No emails or messages will be sent.'
                                    : 'INACTIVE: Normal automation procedures are enabled.'}
                            </p>
                        </div>
                        <button
                            onClick={() => updateConfig('EMERGENCY_STOP', isEmergencyStop ? 'false' : 'true')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all shadow-lg ${isEmergencyStop
                                ? 'bg-white text-red-600 hover:bg-neutral-100'
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                                }`}
                        >
                            {isEmergencyStop ? 'Deactivate Stop' : 'ACTIVATE EMERGENCY STOP'}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex gap-3 p-3 bg-red-100/50 rounded-lg text-red-800 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <p>Activating the kill-switch will force the Automation Engine to fall back to <strong>Simulation Mode</strong> for all leads, even if they have been fully approved.</p>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm opacity-50 pointer-events-none">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Admin Access</h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Change Admin Password</label>
                        <input type="password" placeholder="New password" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                        <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Session Management</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-neutral-900">Session Timeout</p>
                            <p className="text-sm text-neutral-500">Automatically logout after inactivity</p>
                        </div>
                        <select className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm">
                            <option>1 hour</option>
                            <option>8 hours</option>
                            <option>24 hours</option>
                            <option>30 days</option>
                        </select>
                    </div>
                </div>
            </section>
        </div>
    )
}

function NotificationSettings() {
    return (
        <div className="space-y-6">
            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Email Alerts</h2>
                <div className="space-y-4">
                    <ToggleButton label="New Lead Ingested" description="Get notified when a new lead is captured" defaultChecked />
                    <ToggleButton label="High Score Alert" description="Alert when a lead scores 80 or above" defaultChecked />
                    <ToggleButton label="Daily Summary" description="Receive a daily digest of CRM activity" />
                </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 px-1">Integrations</h2>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded border border-neutral-200">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-medium text-neutral-900">Slack Notifications</p>
                            <p className="text-sm text-neutral-500">Send alerts to a Slack channel</p>
                        </div>
                    </div>
                    <button className="px-4 py-1.5 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-100">Connect</button>
                </div>
            </section>
        </div>
    )
}

function DatabaseSettings() {
    return (
        <div className="space-y-6">
            <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-lg font-semibold text-neutral-900">Neon PostgreSQL</h2>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Connected
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total Records</p>
                        <p className="text-xl font-bold text-neutral-900">1,248</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Storage Used</p>
                        <p className="text-xl font-bold text-neutral-900">14.2 MB</p>
                    </div>
                </div>

                <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded-lg flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Migration Mode</p>
                        <p className="text-sm text-amber-800">Prisma is currently using the direct connection URL for migrations. Do not disable pooling for the app client.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}

// Helper Components
function SettingsNavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${active
                ? 'bg-primary-100 text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

function ToggleButton({ label, description, defaultChecked = false }: { label: string, description: string, defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked)
    return (
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
                <p className="font-medium text-neutral-900">{label}</p>
                <p className="text-sm text-neutral-500">{description}</p>
            </div>
            <div
                onClick={() => setChecked(!checked)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-primary-600' : 'bg-neutral-300'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'right-1' : 'left-1'}`} />
            </div>
        </div>
    )
}

function ApiKeyInput({ label, value }: { label: string, value: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">{label}</label>
            <div className="flex gap-2">
                <input
                    type="password"
                    readOnly
                    value={value}
                    className="flex-1 px-4 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-neutral-500 text-sm font-mono"
                />
                <button
                    onClick={handleCopy}
                    className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    )
}
