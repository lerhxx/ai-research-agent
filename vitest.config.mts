import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Vitest 4 不再自动加载 .env，需通过 loadEnv 显式读取后注入 test.env；
  // 第三个参数传 '' 表示加载任意前缀的变量（不限 VITE_ 前缀）。
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      globals: true,
      env,
      include: ['libs/**/*.{test,spec}.ts'],
    },
  };
});
