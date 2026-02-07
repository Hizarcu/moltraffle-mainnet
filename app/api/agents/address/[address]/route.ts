import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const agent = await prisma.agent.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: {
        id: true,
        moltbookId: true,
        name: true,
        description: true,
        avatarUrl: true,
        karmaScore: true,
        isVerified: true,
        followerCount: true,
        walletAddress: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Get agent by address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
