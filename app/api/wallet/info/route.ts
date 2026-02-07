import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// This endpoint returns backend wallet info
export async function GET(request: NextRequest) {
  try {
    const blockchain = getBlockchainService();
    const address = blockchain.getWalletAddress();
    const balance = await blockchain.getBalance();

    return NextResponse.json({
      success: true,
      wallet: {
        address,
        balance: `${balance} ETH`,
        network: 'Base Sepolia',
        chainId: 84532,
      }
    });
  } catch (error: any) {
    console.error('Wallet info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get wallet info' },
      { status: 500 }
    );
  }
}
