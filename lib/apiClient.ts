import { storage } from './storage';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';

interface FetchApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | FormData;
}

const isClient = typeof window !== 'undefined';

/**
 * @param endpoint
 * @param options
 */
export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  const token = await storage.getItem('jwt');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    } else {
      body = JSON.stringify(body);
    }
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[fetchApi] ${options.method || 'GET'} ${fullUrl}`, {
    headers,
    hasToken: !!token,
  });

  const response = await fetch(fullUrl, {
    method: options.method,
    headers,
    body: body as BodyInit | null | undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await storage.removeItem('jwt');
      if (isClient) {
        window.location.href = '/auth/login';
      }
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', response.status);
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ error: 'Bạn không có quyền truy cập tài nguyên này.' }));
      throw new ApiError(errorData.error || 'Bạn không có quyền truy cập tài nguyên này.', response.status);
    }

    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}