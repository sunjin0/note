import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/core/**/__tests__/**/*.test.ts', 'src/core/**/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'e2e'],
    pool: 'vmThreads',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
