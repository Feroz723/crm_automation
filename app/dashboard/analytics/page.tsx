'use client'

import { useState, useEffect } from 'react'
import { StatWidget } from '@/components/analytics/StatWidget'
import { ChartCard } from '@/components/analytics/ChartCard'
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Target, Award } from 'lucide-react'

const COLORS = ['#0ea5e9', '#f59e0b', '#22c55e', '#6b7280', '#8b5cf6']

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('30')

    useEffect(() => {
        fetchAnalytics()
    }, [dateRange])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/analytics?range=${dateRange}`)
            const data = await response.json()
            setAnalytics(data)
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !analytics) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Analytics</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
                            <div className="h-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
                    <p className="text-neutral-600 mt-1">
                        Track your lead generation performance
                    </p>
                </div>

                {/* Date range selector */}
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatWidget
                    label="Total Leads"
                    value={analytics.stats.totalLeads}
                    icon={<Users className="w-5 h-5" />}
                />
                <StatWidget
                    label="Conversion Rate"
                    value={`${analytics.stats.conversionRate}%`}
                    icon={<Target className="w-5 h-5" />}
                />
                <StatWidget
                    label="Average Score"
                    value={analytics.stats.averageScore}
                    icon={<Award className="w-5 h-5" />}
                />
                <StatWidget
                    label="Wins"
                    value={analytics.stats.wonLeads}
                    trend={15}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads by Source */}
                <ChartCard
                    title="Leads by Source"
                    description="Distribution of leads across acquisition channels"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.leadsBySource}
                                dataKey="count"
                                nameKey="source"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {analytics.leadsBySource.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Leads by Status */}
                <ChartCard
                    title="Pipeline Status"
                    description="Current distribution of leads by status"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.leadsByStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Monthly Trend */}
                <ChartCard
                    title="Lead Volume Trend"
                    description="Monthly lead generation over time"
                    className="lg:col-span-2"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                name="Leads"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Score Distribution */}
                <ChartCard
                    title="Score Distribution"
                    description="Lead quality distribution by score range"
                    className="lg:col-span-2"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#22c55e" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    )
}
