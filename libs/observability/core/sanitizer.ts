const SENSITIVE_KEYS = [
  'apiKey',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
];

const MAX_STRING_LENGTH = 2000;
const MAX_DEPTH = 5;

/** 删除 API Key, Authorization, Cookie */
function isIncludeSensitiveKey(key: string) {
  return SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase() === sensitiveKey.toLowerCase());
}

export function sanitize(value: unknown, depth = 0): unknown {
  
  /** 限制对象深度 */
  if (depth > MAX_DEPTH) {
    return '[MaxDepth]';
  }

  /** 限制字符串长度 */
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (isIncludeSensitiveKey(key)) {
        result[key] = '[REDACTED]';
        continue;
      }

      result[key] = sanitize(item, depth + 1);
    }

    return result;
  }

  return '[Unsupported]';
}