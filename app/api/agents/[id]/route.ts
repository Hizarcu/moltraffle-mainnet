import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { moltbookId: id },
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
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Get agent by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
