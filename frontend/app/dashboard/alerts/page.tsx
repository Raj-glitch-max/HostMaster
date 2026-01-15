'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            setLoading(true)
            const data = await api.getAlerts()
            setAlerts(data.alerts || [])
        } catch (error) {
            console.error('Error fetching alerts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.markAlertAsRead(id)
            setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a))
        } catch (error) {
            console.error('Error marking alert as read:', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.deleteAlert(id)
            setAlerts(alerts.filter(a => a.id !== id))
        } catch (error) {
            console.error('Error deleting alert:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Alerts</h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const unreadCount = alerts.filter(a => !a.isRead).length
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200'
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            default: return 'bg-blue-100 text-blue-700 border-blue-200'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Alerts</h1>
                    <p className="text-muted-foreground mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                <Button onClick={fetchAlerts} variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </Button>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {alerts.map((alert) => (
                    <Card
                        key={alert.id}
                        className={`${getSeverityColor(alert.severity)} ${!alert.isRead ? 'border-l-4' : ''}`}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-200' : alert.severity === 'warning' ? 'bg-yellow-200' : 'bg-blue-200'}`}>
                                        {alert.severity === 'critical' ? (
                                            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        ) : alert.severity === 'warning' ? (
                                            <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-base">{alert.title}</CardTitle>
                                            {!alert.isRead && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <CardDescription className="text-sm">
                                            {alert.message}
                                        </CardDescription>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!alert.isRead && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleMarkAsRead(alert.id)}
                                        >
                                            Mark Read
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(alert.id)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {alerts.length === 0 && (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                            <p className="text-muted-foreground">You're all caught up! No alerts at this time.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
