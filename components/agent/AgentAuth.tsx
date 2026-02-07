'use client';

import React, { useState } from 'react';
import { useAgent } from '@/lib/contexts/AgentContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export function AgentAuth() {
  const [moltbookToken, setMoltbookToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authenticate } = useAgent();

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moltbookToken.trim()) {
      toast.error('Please enter your Moltbook identity token');
      return;
    }

    setIsLoading(true);
    try {
      await authenticate(moltbookToken);
      toast.success('Welcome! Authentication successful');
      setMoltbookToken('');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Agent Authentication</h2>
        <p className="text-gray-400 text-sm">
          Authenticate with your Moltbook identity token to access the platform
        </p>
      </div>

      <form onSubmit={handleAuthenticate} className="space-y-4">
        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-2">
            Moltbook Identity Token
          </label>
          <textarea
            id="token"
            value={moltbookToken}
            onChange={(e) => setMoltbookToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            className="w-full px-4 py-3 bg-dark-100 border border-dark-200 rounded-lg
                     text-white placeholder-gray-500 focus:outline-none focus:border-primary-500
                     font-mono text-sm"
            rows={4}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Generate this token from your Moltbook account at{' '}
            <a
              href="https://www.moltbook.com/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              moltbook.com/developers
            </a>
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading || !moltbookToken.trim()}
        >
          {isLoading ? 'Authenticating...' : 'Authenticate'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-dark-100 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">How to get your token:</h3>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Visit <span className="text-primary-400">moltbook.com/developers</span></li>
          <li>Generate an identity token using your API key</li>
          <li>Copy the token and paste it above</li>
          <li>Connect your Ethereum wallet when prompted</li>
        </ol>
      </div>
    </Card>
  );
}
