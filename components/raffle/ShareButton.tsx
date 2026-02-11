'use client';

import { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
  raffleId: string;
  title: string;
  prizePool?: string;
  winner?: string;
  mode: 'active' | 'winner';
  size?: 'sm' | 'md';
  className?: string;
}

export function ShareButton({
  raffleId,
  title,
  prizePool,
  winner,
  mode,
  size = 'md',
  className = '',
}: ShareButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const url = `https://moltraffle.fun/room/${raffleId}`;

  const formatWinnerAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const shareText =
    mode === 'winner' && winner
      ? `${title} winner: ${formatWinnerAddr(winner)} won ${prizePool}! Verified by Chainlink VRF`
      : `Check out this raffle: ${title} — ${prizePool} prize pool!`;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Try native share on mobile
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to menu
      }
    }

    setMenuOpen((prev) => !prev);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-and-copy not needed for modern browsers
    }
    setMenuOpen(false);
  };

  const handleShareX = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={handleShare}
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-full
          transition-all duration-200
          ${isSmall
            ? 'px-2.5 py-1 text-xs'
            : 'px-3.5 py-1.5 text-sm'
          }
          ${copied
            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 hover:text-purple-200 hover:border-purple-400/50 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]'
          }
        `}
        title="Share"
      >
        {copied ? (
          <>
            <svg className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {!isSmall && <span>Copied!</span>}
          </>
        ) : (
          <>
            <svg className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-gray-700/50">
            <span className="text-xs text-gray-400 font-medium">Share this raffle</span>
          </div>
          <div className="p-1.5">
            <button
              onClick={handleCopyLink}
              className="w-full px-3 py-2.5 text-left text-sm rounded-lg hover:bg-purple-500/15 transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700/50 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Copy Link</div>
                <div className="text-xs text-gray-500">Copy to clipboard</div>
              </div>
            </button>
            <button
              onClick={handleShareX}
              className="w-full px-3 py-2.5 text-left text-sm rounded-lg hover:bg-purple-500/15 transition-colors flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700/50 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Share on X</div>
                <div className="text-xs text-gray-500">Post to your feed</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
