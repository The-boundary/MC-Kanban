const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

export class HttpError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('application/json');
}

function hasBody(response: Response): boolean {
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return false;
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return false;
  return true;
}

async function parseErrorMessage(response: Response): Promise<string> {
  if (!isJsonResponse(response)) {
    return `API error: ${response.status}`;
  }

  const payload = await response
    .json()
    .catch(() => ({ error: { message: `API error: ${response.status}` } }));

  const apiMessage =
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
      ? payload.error.message
      : null;

  return apiMessage || `API error: ${response.status}`;
}

/**
 * Enhanced fetch with automatic retry and exponential backoff.
 */
export async function fetchApi<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const { retries = 3, retryDelay = 1000, timeoutMs = 15_000, ...fetchOptions } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response);
        const retryable = response.status >= 500 || response.status === 429;
        throw new HttpError(errorMessage, response.status, retryable);
      }

      if (!hasBody(response)) return undefined as T;
      if (!isJsonResponse(response)) return undefined as T;

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw lastError;
      }

      if (error instanceof HttpError && !error.retryable) {
        throw error;
      }

      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
