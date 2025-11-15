// src/lib/rate-limiter.ts
// Simple in-memory rate limiter for Next.js API routes
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class SimpleRateLimiter {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) { // 15 min window, 100 requests
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      // Reset the counter
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime
      };
    }

    if (this.store[key].count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime
      };
    }

    this.store[key].count++;
    return {
      allowed: true,
      remaining: this.maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime
    };
  }

  // Special method for login attempts (stricter limits)
  checkLoginAttempts(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 5; // Only 5 login attempts per window
    
    const now = Date.now();
    const key = `login_${identifier}`;
    
    if (!this.store[key] || this.store[key].resetTime < now) {
      // Reset the counter
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: this.store[key].resetTime
      };
    }

    if (this.store[key].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime
      };
    }

    this.store[key].count++;
    return {
      allowed: true,
      remaining: maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime
    };
  }
}

// Create a single instance to use across the app
export const rateLimiter = new SimpleRateLimiter();

// Export the login attempts limiter as well
export const loginRateLimiter = new SimpleRateLimiter(15 * 60 * 1000, 5); // 15 min, 5 attempts