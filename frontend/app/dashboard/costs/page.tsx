'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CostsPage() {
    const [costs, setCosts] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCosts()
    }, [])

    const fetchCosts = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:3000/api/v1/costs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setCosts(data)
        } catch (error) {
            console.error('Error fetching costs:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Cost Analysis</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const currentMonth = costs?.currentMonth
    const forecast = costs?.forecast

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Cost Analysis</h1>
                <p className="text-gray-600 mt-1">Detailed breakdown of AWS spending</p>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Current Month</CardDescription>
                        <CardTitle className="text-4xl">${currentMonth?.total?.toFixed(2) || '0.00'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Total spend this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Next Month Forecast</CardDescription>
                        <CardTitle className="text-4xl">${forecast?.nextMonth?.toFixed(2) || '0.00'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Projected spend (30 days)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>3-Month Forecast</CardDescription>
                        <CardTitle className="text-4xl">${forecast?.threeMonths?.toFixed(2) || '0.00'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Projected spend (90 days)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Service */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cost by Service</CardTitle>
                        <CardDescription>Monthly breakdown by AWS service</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {currentMonth?.byService && Object.entries(currentMonth.byService).map(([service, cost]: [string, any]) => {
                                const percentage = ((cost / currentMonth.total) * 100).toFixed(1)
                                return (
                                    <div key={service} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{service.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600">{percentage}%</span>
                                                <span className="font-semibold">${cost.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* By Region */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cost by Region</CardTitle>
                        <CardDescription>Geographic distribution of costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {currentMonth?.byRegion && Object.entries(currentMonth.byRegion).map(([region, cost]: [string, any]) => {
                                const percentage = ((cost / currentMonth.total) * 100).toFixed(1)
                                return (
                                    <div key={region} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">{region}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600">{percentage}%</span>
                                                <span className="font-semibold">${cost.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Cost Trends</CardTitle>
                    <CardDescription>Historical and projected spending</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-gray-600">Cost trend chart coming soon</p>
                            <p className="text-sm text-gray-400 mt-1">Integration with Recharts in progress</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
