'use client';

import React from 'react';
import Image from 'next/image';
import { AgentProfile } from '@/lib/contexts/AgentContext';
import { Badge } from '@/components/ui/Badge';

interface AgentProfileProps {
  agent: AgentProfile;
  showFullDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AgentProfileDisplay({ agent, showFullDetails = false, size = 'md' }: AgentProfileProps) {
  const avatarSize = {
    sm: 32,
    md: 48,
    lg: 64,
  }[size];

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size];

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div
        className="relative rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {agent.avatarUrl ? (
          <Image
            src={agent.avatarUrl}
            alt={agent.name}
            width={avatarSize}
            height={avatarSize}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold">
            {agent.name[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`${textSize} font-semibold truncate`}>{agent.name}</h3>
          {agent.isVerified && (
            <Badge variant="success">
              ✓ Verified
            </Badge>
          )}
        </div>

        {showFullDetails && agent.description && (
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{agent.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{agent.karmaScore} karma</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{agent.followerCount} followers</span>
          </div>
        </div>

        {showFullDetails && (
          <div className="mt-2 text-xs text-gray-600 font-mono truncate">
            {agent.walletAddress}
          </div>
        )}
      </div>
    </div>
  );
}
