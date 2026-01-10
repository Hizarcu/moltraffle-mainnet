'use client';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface WinnerDisplayProps {
  winner: string;
  winnerIndex: number;
  randomNumber: string;
  vrfRequestId: string;
  prizePool: string | number;
  totalParticipants: number;
}

export function WinnerDisplay({
  winner,
  winnerIndex,
  randomNumber,
  vrfRequestId,
  prizePool,
  totalParticipants,
}: WinnerDisplayProps) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="p-8 border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">Winner Selected!</h2>
        <p className="text-gray-400">Congratulations to the lucky winner</p>
      </div>

      {/* Winner Info */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400">Winner Address</span>
          <Badge variant="success">Winner</Badge>
        </div>
        <div className="font-mono text-lg font-semibold text-purple-400 break-all">
          {winner}
        </div>
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-green-400">
            {typeof prizePool === 'string' ? prizePool : `${prizePool} ETH`}
          </div>
          <div className="text-sm text-gray-400 mt-1">Prize Amount</div>
        </div>
      </div>

      {/* VRF Proof */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🔒</span>
          Chainlink VRF Proof
        </h3>

        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Random Number</div>
            <div className="font-mono text-xs break-all text-purple-300">
              {randomNumber}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">Winner Calculation</div>
            <div className="font-mono bg-gray-900/50 p-3 rounded">
              <div className="text-green-400">
                randomNumber % {totalParticipants} = {winnerIndex}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Index {winnerIndex} = {formatAddress(winner)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">VRF Request ID</div>
            <div className="font-mono text-xs break-all">
              {vrfRequestId}
            </div>
          </div>

          <a
            href={`https://vrf.chain.link/`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
          >
            Verify on Chainlink Explorer →
          </a>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <div className="font-semibold text-green-400 mb-1">
                Provably Fair Selection
              </div>
              <div className="text-sm text-gray-400">
                This winner was selected using Chainlink VRF (Verifiable Random Function),
                ensuring cryptographically secure and tamper-proof randomness that can be verified on-chain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
