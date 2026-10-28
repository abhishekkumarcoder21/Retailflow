const API_BASE = '/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include' as RequestCredentials,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{token:string; id:number; email:string; fullName:string; role:string; organizationId:number; organizationName:string; organizationSlug:string}>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: {organizationName:string; organizationSlug:string; businessType?:string; firstName:string; lastName:string; email:string; password:string; phone?:string}) =>
    request<any>('/auth/register', { method: 'POST', body: data }),
  me: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
};

// Analytics
export const analyticsApi = {
  dashboard: () => request<any>('/analytics/dashboard'),
};

// Products
export const productsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/products${qs}`);
  },
  active: () => request<any>('/products/active'),
  categories: () => request<any>('/products/categories'),
  get: (id: number) => request<any>(`/products/${id}`),
  create: (data: any) => request<any>('/products', { method: 'POST', body: data }),
  update: (id: number, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<any>(`/products/${id}`, { method: 'DELETE' }),
};

// Retailers
export const retailersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/retailers${qs}`);
  },
  get: (id: number) => request<any>(`/retailers/${id}`),
  create: (data: any) => request<any>('/retailers', { method: 'POST', body: data }),
  update: (id: number, data: any) => request<any>(`/retailers/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<any>(`/retailers/${id}`, { method: 'DELETE' }),
  assign: (id: number, userId: number) => request<any>(`/retailers/${id}/assign/${userId}`, { method: 'POST' }),
  unassign: (id: number, userId: number) => request<any>(`/retailers/${id}/assign/${userId}`, { method: 'DELETE' }),
};

// Territories
export const territoriesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/territories${qs}`);
  },
  get: (id: number) => request<any>(`/territories/${id}`),
  create: (data: any) => request<any>('/territories', { method: 'POST', body: data }),
  update: (id: number, data: any) => request<any>(`/territories/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<any>(`/territories/${id}`, { method: 'DELETE' }),
};

// Distributors
export const distributorsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/distributors${qs}`);
  },
  get: (id: number) => request<any>(`/distributors/${id}`),
  create: (data: any) => request<any>('/distributors', { method: 'POST', body: data }),
  update: (id: number, data: any) => request<any>(`/distributors/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<any>(`/distributors/${id}`, { method: 'DELETE' }),
};

// Inventory
export const inventoryApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/inventory${qs}`);
  },
  get: (id: number) => request<any>(`/inventory/${id}`),
  lowStock: () => request<any>('/inventory/low-stock'),
  adjust: (data: any) => request<any>('/inventory/adjust', { method: 'POST', body: data }),
  movements: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/inventory/movements${qs}`);
  },
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/orders${qs}`);
  },
  get: (id: number) => request<any>(`/orders/${id}`),
  create: (data: any, idempotencyKey?: string) =>
    request<any>('/orders', {
      method: 'POST',
      body: data,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),
  updateStatus: (id: number, data: { status: string; rejectionReason?: string }) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: data }),
};

// Visits
export const visitsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/visits${qs}`);
  },
  get: (id: number) => request<any>(`/visits/${id}`),
  checkIn: (data: any) => request<any>('/visits/check-in', { method: 'POST', body: data }),
  complete: (id: number, data: any) => request<any>(`/visits/${id}/complete`, { method: 'POST', body: data }),
  cancel: (id: number) => request<any>(`/visits/${id}/cancel`, { method: 'POST' }),
};

// Recommendations
export const recommendationsApi = {
  list: () => request<any>('/recommendations'),
  dismiss: (id: number) => request<any>(`/recommendations/${id}/dismiss`, { method: 'POST' }),
  complete: (id: number) => request<any>(`/recommendations/${id}/complete`, { method: 'POST' }),
  refresh: () => request<any>('/recommendations/refresh', { method: 'POST' }),
};

// Users
export const usersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/users${qs}`);
  },
  get: (id: number) => request<any>(`/users/${id}`),
  create: (data: any) => request<any>('/users', { method: 'POST', body: data }),
  update: (id: number, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => request<any>(`/users/${id}`, { method: 'DELETE' }),
};

// Organizations
export const organizationsApi = {
  current: () => request<any>('/organizations/current'),
  update: (data: any) => request<any>('/organizations/current', { method: 'PUT', body: data }),
};

// Audit Logs
export const auditLogsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/audit-logs${qs}`);
  },
};
