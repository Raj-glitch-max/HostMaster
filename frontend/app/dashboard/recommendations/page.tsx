'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRecommendations()
    }, [])

    const fetchRecommendations = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:3000/api/v1/costs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setRecommendations(data.recommendations || [])
        } catch (error) {
            console.error('Error fetching recommendations:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Recommendations</h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const totalSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Optimization Recommendations</h1>
                    <p className="text-gray-600 mt-1">AI-powered suggestions to reduce AWS costs</p>
                </div>
                <Button onClick={fetchRecommendations} variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </Button>
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none  " stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-green-900">
                                ${totalSavings.toFixed(2)} / month
                            </p>
                            <p className="text-green-700">
                                Potential savings from {recommendations.length} recommendations
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{rec.type.replace('-', ' ').toUpperCase()}</CardTitle>
                                        <CardDescription className="mt-1">{rec.resource}</CardDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">${rec.savings.toFixed(2)}</p>
                                    <p className="text-xs text-gray-600">monthly savings</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600">Current Cost:</span>
                                    <span className="font-semibold">${rec.currentCost.toFixed(2)}/month</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600">Recommended Cost:</span>
                                    <span className="font-semibold text-green-600">${rec.recommendedCost.toFixed(2)}/month</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Recommended Action:</p>
                                    <p className="text-sm text-gray-600">{rec.action}</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="default">
                                        Apply Recommendation
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        Learn More
                                    </Button>
                                    <Button size="sm" variant="ghost">
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {recommendations.length === 0 && (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations</h3>
                            <p className="text-gray-600">Your AWS infrastructure is optimally configured!</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
