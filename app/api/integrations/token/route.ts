import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/integrations/token
 * Generate integration token for n8n and external services
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as any;

        // Validate
        if (!body.name) {
            return NextResponse.json(
                { error: 'Token name is required' },
                { status: 400 }
            );
        }

        // Generate secure token
        const token = `int_${crypto.randomBytes(32).toString('hex')}`;

        // Save to database
        const integrationToken = await prisma.integrationToken.create({
            data: {
                token,
                name: body.name,
                userId: body.userId,
                active: true,
            },
        });

        return NextResponse.json({
            success: true,
            token: integrationToken.token,
            id: integrationToken.id,
            name: integrationToken.name,
        });
    } catch (error: any) {
        console.error('Token generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/integrations/token
 * List all integration tokens
 */
export async function GET() {
    try {
        const tokens = await prisma.integrationToken.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                token: true,
                lastUsed: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ tokens });
    } catch (error: any) {
        console.error('Token fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/integrations/token
 * Revoke integration token
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenId = searchParams.get('id');

        if (!tokenId) {
            return NextResponse.json(
                { error: 'Token ID is required' },
                { status: 400 }
            );
        }

        await prisma.integrationToken.update({
            where: { id: tokenId },
            data: { active: false },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Token revocation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
