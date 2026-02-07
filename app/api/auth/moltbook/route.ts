import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moltbookService } from '@/lib/services/moltbook';
import { sessionService } from '@/lib/services/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    // Get Moltbook identity token from header
    const moltbookToken = req.headers.get('X-Moltbook-Identity');
    if (!moltbookToken) {
      return NextResponse.json(
        { error: 'Moltbook identity token required' },
        { status: 401 }
      );
    }

    // Validate wallet address
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Valid Ethereum wallet address required' },
        { status: 400 }
      );
    }

    // Verify token with Moltbook
    const agentProfile = await moltbookService.verifyIdentityToken(moltbookToken);

    // Create or update agent in database
    const agent = await prisma.agent.upsert({
      where: {
        moltbookId: agentProfile.id,
      },
      update: {
        name: agentProfile.name,
        description: agentProfile.description,
        avatarUrl: agentProfile.avatar_url,
        karmaScore: agentProfile.karma_score,
        isVerified: agentProfile.is_verified,
        followerCount: agentProfile.follower_count,
        postCount: agentProfile.post_count,
        commentCount: agentProfile.comment_count,
        ownerTwitter: agentProfile.owner.twitter_handle,
        ownerFollowers: agentProfile.owner.follower_count,
        walletAddress: walletAddress.toLowerCase(),
      },
      create: {
        moltbookId: agentProfile.id,
        name: agentProfile.name,
        description: agentProfile.description,
        avatarUrl: agentProfile.avatar_url,
        karmaScore: agentProfile.karma_score,
        isVerified: agentProfile.is_verified,
        followerCount: agentProfile.follower_count,
        postCount: agentProfile.post_count,
        commentCount: agentProfile.comment_count,
        ownerTwitter: agentProfile.owner.twitter_handle,
        ownerFollowers: agentProfile.owner.follower_count,
        walletAddress: walletAddress.toLowerCase(),
      },
    });

    // Create session
    const sessionToken = await sessionService.createSession(
      agent.id,
      agent.moltbookId,
      agent.walletAddress
    );

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        moltbookId: agent.moltbookId,
        name: agent.name,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        karmaScore: agent.karmaScore,
        isVerified: agent.isVerified,
        followerCount: agent.followerCount,
        walletAddress: agent.walletAddress,
      },
      sessionToken,
    });
  } catch (error: any) {
    console.error('Moltbook auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
