'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ResourcesPage() {
    const [resources, setResources] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchResources()
    }, [])

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://localhost:3000/api/v1/resources', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setResources(data)
        } catch (error) {
            console.error('Error fetching resources:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Resources</h1>
                <Card className="animate-pulse">
                    <CardContent className="p-12">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const ec2Instances = resources?.ec2Instances || []
    const rdsInstances = resources?.rdsInstances || []
    const allResources = [
        ...ec2Instances.map((r: any) => ({ ...r, type: 'EC2' })),
        ...rdsInstances.map((r: any) => ({ ...r, type: 'RDS' }))
    ]

    const filteredResources = filter === 'all'
        ? allResources
        : allResources.filter(r => r.type === filter)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resources</h1>
                    <p className="text-gray-600 mt-1">View and manage all AWS resources</p>
                </div>
                <Button onClick={fetchResources}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Resources</CardDescription>
                        <CardTitle className="text-3xl">{allResources.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Across all services</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>EC2 Instances</CardDescription>
                        <CardTitle className="text-3xl">{ec2Instances.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Running compute instances</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>RDS Databases</CardDescription>
                        <CardTitle className="text-3xl">{rdsInstances.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-600">Managed database instances</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
                {['all', 'EC2', 'RDS'].map((f) => (
                    <Button
                        key={f}
                        onClick={() => setFilter(f)}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                    >
                        {f === 'all' ? 'All Resources' : f}
                    </Button>
                ))}
            </div>

            {/* Resources Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Resource Inventory</CardTitle>
                    <CardDescription>
                        Showing {filteredResources.length} resources
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Instance Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Region</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Monthly Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResources.map((resource: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${resource.type === 'EC2'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {resource.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">{resource.id}</td>
                                        <td className="py-3 px-4">{resource.type === 'EC2' ? resource.type : resource.type}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${resource.state === 'running' || resource.multiAZ
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {resource.state || (resource.multiAZ ? 'Multi-AZ' : 'Single-AZ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{resource.region || 'us-east-1'}</td>
                                        <td className="py-3 px-4 text-right font-medium">${resource.monthlyCost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredResources.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-600">No resources found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
