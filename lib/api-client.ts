/**
 * API 客户端封装
 * 统一处理 API 请求、错误处理、Token 管理
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * 获取认证 Token
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * 设置认证 Token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * 清除认证 Token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('token');
};

/**
 * 统一的 API 请求方法
 */
const request = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { requiresAuth = true, headers = {}, ...restConfig } = config;

  // 构建完整 URL
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  // 构建请求头
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 添加认证 Token
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...restConfig,
      headers: requestHeaders,
    });

    // 处理 401 未授权错误
    if (response.status === 401) {
      clearAuthToken();
      // 可以在这里触发重定向到登录页
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      throw new APIError(
        response.status,
        response.statusText,
        'Unauthorized'
      );
    }

    // 处理其他错误状态码
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        response.statusText,
        errorData.message || `Request failed with status ${response.status}`,
        errorData
      );
    }

    // 处理空响应
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null as T;
    }

    // 解析 JSON 响应
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // 网络错误或其他错误
    if (error instanceof Error) {
      throw new APIError(0, 'Network Error', error.message);
    }

    throw new APIError(0, 'Unknown Error', 'An unknown error occurred');
  }
};

/**
 * API 客户端对象
 */
export const apiClient = {
  /**
   * GET 请求
   */
  get: <T = any>(endpoint: string, config?: RequestConfig) => {
    return request<T>(endpoint, { ...config, method: 'GET' });
  },

  /**
   * POST 请求
   */
  post: <T = any>(endpoint: string, data?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT 请求
   */
  put: <T = any>(endpoint: string, data?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE 请求
   */
  delete: <T = any>(endpoint: string, config?: RequestConfig) => {
    return request<T>(endpoint, { ...config, method: 'DELETE' });
  },

  /**
   * PATCH 请求
   */
  patch: <T = any>(endpoint: string, data?: any, config?: RequestConfig) => {
    return request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * 文件上传
   */
  upload: async <T = any>(
    endpoint: string,
    file: File,
    config?: RequestConfig
  ): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
      ...config,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        response.statusText,
        errorData.message || 'Upload failed',
        errorData
      );
    }

    return await response.json();
  },
};

/**
 * API 端点常量
 */
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },

  // 用户相关
  USERS: {
    ME: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPDATE_AVATAR: '/users/me/avatar',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    CHART: '/dashboard/chart',
    ACTIVITIES: '/dashboard/activities',
  },

  // 项目相关
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    DEPLOY: (id: string) => `/projects/${id}/deploy`,
  },

  // 团队相关
  TEAMS: {
    LIST: '/teams',
    CREATE: '/teams',
    GET: (id: string) => `/teams/${id}`,
    UPDATE: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
    INVITE: (id: string) => `/teams/${id}/invite`,
  },

  // 账单相关
  BILLING: {
    SUBSCRIPTION: '/billing/subscription',
    UPGRADE: '/billing/upgrade',
    INVOICES: '/billing/invoices',
    CANCEL: '/billing/cancel',
  },

  // API 密钥
  API_KEYS: {
    LIST: '/keys',
    CREATE: '/keys',
    DELETE: (id: string) => `/keys/${id}`,
    ROTATE: (id: string) => `/keys/${id}/rotate`,
  },

  // 设置
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    NOTIFICATIONS: '/settings/notifications',
    SECURITY: '/settings/security',
  },

  // AI 服务
  AI: {
    GENERATE_PROJECT: '/ai/generate-project',
    CHAT: '/ai/chat',
    IMAGE_GENERATE: '/ai/image-generate',
    AGENTS_CREATE: '/ai/agents/create',
    AGENTS_LIST: '/ai/agents/list',
  },

  // 部署服务
  DEPLOY: {
    VERCEL: '/deploy/vercel',
    STATUS: (id: string) => `/deploy/status/${id}`,
    BATCH: '/deploy/batch',
  },

  // Figma
  FIGMA: {
    FILE: (fileKey: string) => `/figma/file/${fileKey}`,
    IMAGES: '/figma/images',
  },

  // 存储
  STORAGE: {
    UPLOAD: '/storage/upload',
    GCS_UPLOAD: '/storage/gcs/upload',
    GCS_LIST: '/storage/gcs/list',
  },

  // 广告
  ADS: {
    CAMPAIGNS: '/ads/campaigns',
    CAMPAIGN: (id: string) => `/ads/campaigns/${id}`,
    GENERATE_COPY: '/ads/generate-copy',
    METRICS: '/ads/metrics',
  },
};

export { APIError };
