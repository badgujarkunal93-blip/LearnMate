import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Helper to extract the origin (protocol + host) from a full URL
function getOrigin(urlStr) {
  try {
    return new URL(urlStr).origin;
  } catch (e) {
    return urlStr || '';
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the root folder
  const env = loadEnv(mode, process.cwd(), '');

  const watsonxOrigin = getOrigin(env.VITE_WATSONX_API_URL);
  const cloudantOrigin = getOrigin(env.VITE_CLOUDANT_URL);

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy IAM token exchange requests to bypass CORS
        '/api/iam': {
          target: 'https://iam.cloud.ibm.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/iam/, '')
        },
        // Proxy watsonx Orchestrate agent completions requests
        '/api/watsonx': {
          target: watsonxOrigin || 'https://api.us-south.watson-orchestrate.cloud.ibm.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/watsonx/, '')
        },
        // Proxy Cloudant NoSQL database CRUD requests
        '/api/cloudant': {
          target: cloudantOrigin || 'https://localhost',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cloudant/, '')
        }
      }
    }
  }
})
