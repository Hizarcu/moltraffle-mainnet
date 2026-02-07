import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionService } from '@/lib/services/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await sessionService.verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: session.agentId },
      select: {
        id: true,
        moltbookId: true,
        name: true,
        description: true,
        avatarUrl: true,
        karmaScore: true,
        isVerified: true,
        followerCount: true,
        postCount: true,
        commentCount: true,
        ownerTwitter: true,
        ownerFollowers: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
