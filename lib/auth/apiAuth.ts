import { NextRequest, NextResponse } from "next/server";

export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  tier: "free" | "developer" | "professional" | "enterprise";
  credits: number;
  maxCredits: number;
  rateLimit: number;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  apiKey?: ApiKeyData;
  user?: {
    id: string;
    email: string;
    tier: string;
  };
}

// In production, this would be stored in a database
const API_KEYS_STORE = new Map<string, ApiKeyData>();

// Demo API keys for testing
API_KEYS_STORE.set("demo_free_key_123", {
  id: "demo_free_key_123",
  userId: "demo_user_1",
  name: "Demo Free Key",
  tier: "free",
  credits: 50,
  maxCredits: 100,
  rateLimit: 10,
  createdAt: new Date(),
  isActive: true,
});

API_KEYS_STORE.set("demo_dev_key_456", {
  id: "demo_dev_key_456",
  userId: "demo_user_2",
  name: "Demo Developer Key",
  tier: "developer",
  credits: 2500,
  maxCredits: 5000,
  rateLimit: 100,
  createdAt: new Date(),
  isActive: true,
});

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = "rp_";
  const randomPart =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return prefix + randomPart;
}

/**
 * Create a new API key
 */
export function createApiKey(
  data: Omit<ApiKeyData, "id" | "createdAt">
): string {
  const apiKey = generateApiKey();
  const keyData: ApiKeyData = {
    ...data,
    id: apiKey,
    createdAt: new Date(),
  };

  API_KEYS_STORE.set(apiKey, keyData);
  return apiKey;
}

/**
 * Validate API key and return key data
 */
export function validateApiKey(apiKey: string): ApiKeyData | null {
  const keyData = API_KEYS_STORE.get(apiKey);

  if (!keyData || !keyData.isActive) {
    return null;
  }

  if (keyData.expiresAt && keyData.expiresAt < new Date()) {
    return null;
  }

  return keyData;
}

/**
 * Deduct credits from API key
 */
export function deductCredits(apiKey: string, credits: number): boolean {
  const keyData = API_KEYS_STORE.get(apiKey);

  if (!keyData || keyData.credits < credits) {
    return false;
  }

  keyData.credits -= credits;
  API_KEYS_STORE.set(apiKey, keyData);
  return true;
}

/**
 * Get rate limit info for API key
 */
export function getRateLimit(apiKey: string): {
  limit: number;
  remaining: number;
  resetTime: Date;
} {
  const keyData = API_KEYS_STORE.get(apiKey);

  if (!keyData) {
    return { limit: 0, remaining: 0, resetTime: new Date() };
  }

  // Simplified rate limiting - in production use Redis or similar
  const now = new Date();
  const resetTime = new Date(now.getTime() + 60 * 1000); // Reset every minute

  return {
    limit: keyData.rateLimit,
    remaining: Math.max(0, keyData.rateLimit - 5), // Mock remaining calls
    resetTime,
  };
}

/**
 * Authentication middleware for API routes
 */
export async function authenticateApiRequest(request: NextRequest): Promise<{
  success: boolean;
  data?: ApiKeyData;
  error?: string;
  response?: NextResponse;
}> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return {
        success: false,
        error: "Missing Authorization header",
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "MISSING_AUTH",
              message: "Authorization header is required",
              details:
                'Please provide your API key in the Authorization header as "Bearer YOUR_API_KEY"',
            },
          },
          { status: 401 }
        ),
      };
    }

    const [bearer, apiKey] = authHeader.split(" ");

    if (bearer !== "Bearer" || !apiKey) {
      return {
        success: false,
        error: "Invalid Authorization header format",
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_AUTH_FORMAT",
              message: "Invalid Authorization header format",
              details: 'Use format: "Bearer YOUR_API_KEY"',
            },
          },
          { status: 401 }
        ),
      };
    }

    const keyData = validateApiKey(apiKey);

    if (!keyData) {
      return {
        success: false,
        error: "Invalid API key",
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_API_KEY",
              message: "Invalid or expired API key",
              details:
                "Please check your API key or generate a new one at rugproofai.com/api",
            },
          },
          { status: 401 }
        ),
      };
    }

    // Check rate limits
    const rateLimit = getRateLimit(apiKey);
    if (rateLimit.remaining <= 0) {
      return {
        success: false,
        error: "Rate limit exceeded",
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Rate limit exceeded",
              details: `You have exceeded your rate limit of ${
                rateLimit.limit
              } requests per minute. Try again after ${rateLimit.resetTime.toISOString()}`,
            },
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": rateLimit.limit.toString(),
              "X-RateLimit-Remaining": rateLimit.remaining.toString(),
              "X-RateLimit-Reset": rateLimit.resetTime.toISOString(),
            },
          }
        ),
      };
    }

    return {
      success: true,
      data: keyData,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Authentication failed",
            details: "An error occurred while validating your API key",
          },
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper function to create authenticated response with usage info
 */
export function createAuthenticatedResponse(
  data: unknown,
  apiKey: ApiKeyData,
  creditsUsed: number = 1
): NextResponse {
  const rateLimit = getRateLimit(apiKey.id);

  return NextResponse.json(
    {
      success: true,
      data,
      credits_used: creditsUsed,
      credits_remaining: apiKey.credits - creditsUsed,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.resetTime.toISOString(),
        "X-Credits-Used": creditsUsed.toString(),
        "X-Credits-Remaining": (apiKey.credits - creditsUsed).toString(),
      },
    }
  );
}
