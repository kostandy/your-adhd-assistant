import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';


export default [
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['src/**/*.js'],
    ignores: ['node_modules', 'dist'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        // Cloudflare Workers globals
        Response: 'readonly',
        Request: 'readonly',
        WebSocket: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        // Web Workers API globals
        self: 'readonly',
        ServiceWorkerGlobalScope: 'readonly',
        WorkerGlobalScope: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        postMessage: 'readonly',
        importScripts: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Streams API
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        // Cloudflare-specific
        caches: 'readonly',
        CacheStorage: 'readonly',
        Cache: 'readonly',
        // Add other Cloudflare Worker globals as needed
      }
    },
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage'], // Browser APIs not available in Workers
      'no-restricted-modules': ['error', {
        patterns: ['fs', 'path', 'http', 'child_process'] // Node.js modules not available in Workers
      }],
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }], // Allow console.error/warn/info for debugging
      'no-process-env': 'error', // Prevent usage of process.env
      'no-buffer-constructor': 'error', // Buffer not available in Workers
      'import/no-nodejs-modules': 'error', // Prevent Node.js built-in modules
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Use env parameter from Cloudflare Workers instead.'
        }
      ]
    }
  }
];