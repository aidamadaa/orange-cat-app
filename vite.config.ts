import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Check if a shared key exists in the environment
  const hasSharedKey = !!(env.API_KEY || process.env.API_KEY);

  return {
    plugins: [react()],
    build: {
      target: 'es2015', // Lower target for better Android compatibility
      outDir: 'dist',
    },
    define: {
      // Prioritize env variable from loadEnv, but fallback to process.env for Vercel build contexts
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      // Expose the boolean flag to the client
      'process.env.HAS_SHARED_KEY': JSON.stringify(hasSharedKey)
    }
  };
});