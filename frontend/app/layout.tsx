import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'HostMaster - AWS Cost Optimization Platform',
    description: 'Analyze AWS costs, discover resources, and get optimization recommendations',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
