import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10);

interface SessionPayload {
  agentId: string;
  moltbookId: string;
  walletAddress: string;
}

export class SessionService {
  /**
   * Create new session token for agent
   */
  async createSession(agentId: string, moltbookId: string, walletAddress: string): Promise<string> {
    const payload: SessionPayload = {
      agentId,
      moltbookId,
      walletAddress: walletAddress.toLowerCase(),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: `${SESSION_EXPIRY_HOURS}h`,
    });

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + SESSION_EXPIRY_HOURS);

    // Store session in database
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        sessionToken: token,
        sessionExpiry: expiry,
        lastLoginAt: new Date(),
      },
    });

    return token;
  }

  /**
   * Verify session token and return agent data
   */
  async verifySession(token: string): Promise<SessionPayload | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;

      // Check if session exists and is not expired
      const agent = await prisma.agent.findFirst({
        where: {
          id: payload.agentId,
          sessionToken: token,
          sessionExpiry: {
            gt: new Date(),
          },
        },
      });

      if (!agent) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Destroy session
   */
  async destroySession(token: string): Promise<void> {
    const payload = await this.verifySession(token);
    if (payload) {
      await prisma.agent.update({
        where: { id: payload.agentId },
        data: {
          sessionToken: null,
          sessionExpiry: null,
        },
      });
    }
  }

  /**
   * Refresh session (extend expiry)
   */
  async refreshSession(token: string): Promise<string | null> {
    const payload = await this.verifySession(token);
    if (!payload) {
      return null;
    }

    return this.createSession(payload.agentId, payload.moltbookId, payload.walletAddress);
  }
}

export const sessionService = new SessionService();
