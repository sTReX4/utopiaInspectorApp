import { supabase } from './supabase';

/* Every server route the app calls lives on the deployed dashboard. Point a
 * build at a preview deployment with EXPO_PUBLIC_API_URL instead of editing
 * the URL into each screen the way the old provisioning flow did. */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://utopia-inspector-app.vercel.app'
).replace(/\/+$/, '');

export class ApiError extends Error {
  /** 0 when the request never reached the server. */
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const isOffline = (error: unknown) => error instanceof ApiError && error.status === 0;

/* Attaches the Supabase session token so the route can verify who is asking
 * before its service key touches a row. */
export async function authorizedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('Could not reach Utopia servers.', 0);
  }

  const body = await response.text();
  let parsed: any = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    /* Only a JSON `error` is ours to show. Anything else means the request
     * never reached the route -- most often a Next.js 404 page from a
     * deployment that predates these endpoints -- and putting that markup in
     * an alert buries the actual problem in a screenful of HTML. */
    if (typeof parsed?.error !== 'string') {
      console.error(
        `Unexpected ${response.status} from ${path}:`,
        body.slice(0, 200)
      );
    }

    throw new ApiError(resolveErrorMessage(parsed, response.status), response.status);
  }

  return parsed as T;
}

function resolveErrorMessage(parsed: any, status: number): string {
  if (typeof parsed?.error === 'string') return parsed.error;

  if (status === 404) {
    return 'The Utopia server is missing the inspector endpoints. It needs to be redeployed before sign-up can complete.';
  }

  if (status >= 500) {
    return 'Utopia servers reported an error. Please try again shortly.';
  }

  return `Utopia servers returned an unexpected response (HTTP ${status}).`;
}
