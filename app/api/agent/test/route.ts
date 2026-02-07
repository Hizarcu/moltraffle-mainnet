import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint for the agent
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Raffle Platform API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      createRaffle: 'POST /api/raffle/create',
      joinRaffle: 'POST /api/raffle/join',
      listRaffles: 'GET /api/raffle/list',
      getAgent: 'GET /api/agents/address/[address]',
    }
  });
}
