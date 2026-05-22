import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/analytics
 * Fetch analytics data for dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateRange = searchParams.get('range') || '30'; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Leads by source
        const leadsBySource = await prisma.lead.groupBy({
            by: ['source'],
            _count: true,
            where: {
                createdAt: { gte: startDate },
            },
        });

        // Leads by status
        const leadsByStatus = await prisma.lead.groupBy({
            by: ['status'],
            _count: true,
            where: {
                createdAt: { gte: startDate },
            },
        });

        // Score distribution
        const scoreDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN score BETWEEN 0 AND 20 THEN '0-20'
          WHEN score BETWEEN 21 AND 40 THEN '21-40'
          WHEN score BETWEEN 41 AND 60 THEN '41-60'
          WHEN score BETWEEN 61 AND 80 THEN '61-80'
          WHEN score BETWEEN 81 AND 100 THEN '81-100'
        END as range,
        COUNT(*) as count
      FROM leads
      WHERE created_at >= ${startDate}
      GROUP BY range
      ORDER BY range
    `;

        // Monthly trend (last 12 months)
        const monthlyTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `;

        // Conversion rates
        const totalLeads = await prisma.lead.count({
            where: { createdAt: { gte: startDate } },
        });

        const wonLeads = await prisma.lead.count({
            where: {
                status: 'won',
                createdAt: { gte: startDate },
            },
        });

        const lostLeads = await prisma.lead.count({
            where: {
                status: 'lost',
                createdAt: { gte: startDate },
            },
        });

        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

        // Average score
        const avgScore = await prisma.lead.aggregate({
            _avg: { score: true },
            where: { createdAt: { gte: startDate } },
        });

        // Recent activity count
        const recentActivities = await prisma.activity.count({
            where: { createdAt: { gte: startDate } },
        });

        // Helper to convert BigInt to Number
        const serializeBigInt = (data: any) => {
            return JSON.parse(JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? Number(value) : value
            ));
        };

        return NextResponse.json({
            leadsBySource: leadsBySource.map((item: any) => ({
                source: item.source,
                count: item._count,
            })),
            leadsByStatus: leadsByStatus.map((item: any) => ({
                status: item.status,
                count: item._count,
            })),
            scoreDistribution: serializeBigInt(scoreDistribution),
            monthlyTrend: serializeBigInt(monthlyTrend),
            stats: {
                totalLeads,
                wonLeads,
                lostLeads,
                conversionRate: Math.round(conversionRate * 100) / 100,
                averageScore: Math.round((avgScore._avg.score || 0) * 100) / 100,
                recentActivities,
            },
        });
    } catch (error: any) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
