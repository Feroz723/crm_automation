import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const logs = await prisma.webhookLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ logs })
    } catch (error) {
        console.error('Failed to fetch webhook logs:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
