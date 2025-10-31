/**
 * Type definitions for Elysia context
 */

export interface ElysiaContext {
  request: Request;
  params: Record<string, string>;
  query: Record<string, string>;
  body?: any;
}

