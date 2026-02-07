interface MoltbookAgentProfile {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  karma_score: number;
  is_verified: boolean;
  follower_count: number;
  post_count: number;
  comment_count: number;
  owner: {
    twitter_handle?: string;
    follower_count: number;
  };
}

export class MoltbookService {
  private readonly apiUrl: string;
  private readonly appKey: string;

  constructor() {
    this.apiUrl = process.env.MOLTBOOK_API_URL || 'https://www.moltbook.com/api/v1';
    this.appKey = process.env.MOLTBOOK_APP_KEY || '';

    if (!this.appKey) {
      throw new Error('MOLTBOOK_APP_KEY is required');
    }
  }

  /**
   * Verify Moltbook identity token and return agent profile
   */
  async verifyIdentityToken(token: string, audience?: string): Promise<MoltbookAgentProfile> {
    const response = await fetch(`${this.apiUrl}/agents/verify-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Moltbook-App-Key': this.appKey,
      },
      body: JSON.stringify({
        token,
        audience: audience || 'raffle-platform',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Verification failed' }));
      throw new Error(`Moltbook verification failed: ${error.message}`);
    }

    return response.json();
  }

  /**
   * Check if token is expired (JWT expiry check)
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const moltbookService = new MoltbookService();
