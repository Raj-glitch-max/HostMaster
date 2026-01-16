'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardStats()
    }, [])

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch costs data
            const response = await fetch('http://localhost:3000/api/v1/costs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const currentMonthCost = stats?.currentMonth?.total || 0
    const forecastNextMonth = stats?.forecast?.nextMonth || 0
    const potentialSavings = stats?.recommendations?.reduce((sum: number, rec: any) => sum + rec.savings, 0) || 0
    const ec2Cost = stats?.currentMonth?.byService?.EC2 || 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600 mt-1">Overview of your AWS infrastructure and costs</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Current Month</CardDescription>
                        <CardTitle className="text-3xl">${currentMonthCost.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Total AWS spend this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Forecast (Next Month)</CardDescription>
                        <CardTitle className="text-3xl">${forecastNextMonth.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">
                            {forecastNextMonth > currentMonthCost ? (
                                <span className="text-red-600">↑ {((forecastNextMonth - currentMonthCost) / currentMonthCost * 100).toFixed(1)}% increase</span>
                            ) : (
                                <span className="text-green-600">↓ {((currentMonthCost - forecastNextMonth) / currentMonthCost * 100).toFixed(1)}% decrease</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Potential Savings</CardDescription>
                        <CardTitle className="text-3xl text-green-600">${potentialSavings.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">{stats?.recommendations?.length || 0} optimization opportunities</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Largest Cost</CardDescription>
                        <CardTitle className="text-3xl">${ec2Cost.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">EC2 Compute ({((ec2Cost / currentMonthCost) * 100).toFixed(0)}% of total)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cost by Service</CardTitle>
                        <CardDescription>Monthly breakdown by AWS service</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.currentMonth?.byService && Object.entries(stats.currentMonth.byService).map(([service, cost]: [string, any]) => (
                                <div key={service} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full"
                                                style={{ width: `${(cost / currentMonthCost) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-40 ml-4">
                                        <span className="text-sm font-medium">{service.replace('_', ' ')}</span>
                                        <span className="text-sm text-gray-600">${cost.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Recommendations</CardTitle>
                        <CardDescription>Quick wins to reduce AWS costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{rec.action}</p>
                                        <p className="text-xs text-gray-600 mt-1">Save ${rec.savings.toFixed(2)}/month</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
