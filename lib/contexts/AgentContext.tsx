'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface AgentProfile {
  id: string;
  moltbookId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  karmaScore: number;
  isVerified: boolean;
  followerCount: number;
  walletAddress: string;
}

interface AgentContextValue {
  agent: AgentProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: (moltbookToken: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem('agent_session_token');
        if (storedToken) {
          // Verify session is still valid
          const response = await fetch('/api/agents/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setAgent(data.agent);
            setSessionToken(storedToken);
          } else {
            // Invalid session, clear it
            localStorage.removeItem('agent_session_token');
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const authenticate = async (moltbookToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      const response = await fetch('/api/auth/moltbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Moltbook-Identity': moltbookToken,
        },
        body: JSON.stringify({
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await response.json();
      setAgent(data.agent);
      setSessionToken(data.sessionToken);

      // Store session token
      localStorage.setItem('agent_session_token', data.sessionToken);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAgent(null);
    setSessionToken(null);
    localStorage.removeItem('agent_session_token');
  };

  return (
    <AgentContext.Provider
      value={{
        agent,
        sessionToken,
        isAuthenticated: !!agent && !!sessionToken,
        isLoading,
        authenticate,
        logout,
        error,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}
