'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:3000/api/v1/costs', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Mock trend data for charts
    const costTrendData = [
        { month: 'Jul', cost: 145 },
        { month: 'Aug', cost: 152 },
        { month: 'Sep', cost: 148 },
        { month: 'Oct', cost: 156 },
        { month: 'Nov', cost: 162 },
        { month: 'Dec', cost: 156 },
    ]

    const serviceData = [
        { name: 'EC2', value: 65.32, color: '#3b82f6' },
        { name: 'RDS', value: 42.18, color: '#8b5cf6' },
        { name: 'NAT', value: 32.00, color: '#06b6d4' },
        { name: 'ALB', value: 16.95, color: '#10b981' },
    ]

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse bg-card border-white/10">
                            <CardHeader>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-muted rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const currentMonthCost = stats?.currentMonth?.total || 156.45
    const forecastNextMonth = stats?.forecast?.nextMonth || 165.20
    const potentialSavings = stats?.recommendations?.reduce((sum: number, rec: any) => sum + rec.savings, 0) || 32.66

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
                <p className="text-muted-foreground">Real-time AWS cost analytics and optimization insights</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-white/10 hover:border-white/20 transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground">Current Month</CardDescription>
                        <CardTitle className="text-3xl font-bold">${currentMonthCost.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-500 flex items-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                12.5%
                            </span>
                            <span className="text-muted-foreground">from last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-white/10 hover:border-white/20 transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription>Next Month</CardDescription>
                        <CardTitle className="text-3xl font-bold">${forecastNextMonth.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-orange-500">↗ Increasing</span>
                            <span className="text-muted-foreground">trend detected</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-400">Potential Savings</CardDescription>
                        <CardTitle className="text-3xl font-bold text-green-400">${potentialSavings.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-green-400/80">
                            <span>3 optimization opportunities</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-white/10 hover:border-white/20 transition-all">
                    <CardHeader className="pb-2">
                        <CardDescription>Resources</CardDescription>
                        <CardTitle className="text-3xl font-bold">{(stats?.ec2Instances?.length || 1) + (stats?.rdsInstances?.length || 1)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Across 2 services</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Trend */}
                <Card className="bg-card border-white/10">
                    <CardHeader>
                        <CardTitle>Cost Trend</CardTitle>
                        <CardDescription>Monthly AWS spending over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={costTrendData}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Service Breakdown */}
                <Card className="bg-card border-white/10">
                    <CardHeader>
                        <CardTitle>Cost by Service</CardTitle>
                        <CardDescription>Distribution of spending across AWS services</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={serviceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-card border-white/10">
                <CardHeader>
                    <CardTitle>Top Recommendations</CardTitle>
                    <CardDescription>AI-powered cost optimization suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium mb-1">{rec.action}</p>
                                    <p className="text-sm text-muted-foreground">Save ${rec.savings.toFixed(2)}/month • {rec.type.replace('-', ' ')}</p>
                                </div>
                                <div className="text-green-400 font-bold text-lg">
                                    ${rec.savings.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
