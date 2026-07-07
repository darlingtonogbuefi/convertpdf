export type BackendProvider = 'azure' | 'aws';

const BACKENDS: Record<BackendProvider, string> = {
  azure:
    import.meta.env.VITE_AZURE_BACKEND_URL ||
    'https://pdfconvertpro-apim.azure-api.net',
    /*'https://pdfconvertpro-api.azurewebsites.net',*/

  aws:
    import.meta.env.VITE_AWS_BACKEND_URL ||
    'https://pdfconvertpro.cribr.co.uk',
};

/**
 * Runtime backend state (single source of truth)
 */
let activeBackend: BackendProvider = 'azure'; // ✅ FIX: safe default (prevents broken AWS startup)

/**
 * Restore saved backend on app load
 */
const saved = localStorage.getItem('backend_provider') as BackendProvider | null;

if (saved === 'aws' || saved === 'azure') {
  activeBackend = saved;
} else {
  // ✅ FIX: prevent invalid/stale state from locking app into broken backend
  activeBackend = 'azure';
  localStorage.setItem('backend_provider', 'azure');
}

/**
 * Set backend provider (runtime + persistence)
 */
export function setBackendProvider(provider: BackendProvider) {
  activeBackend = provider;
  localStorage.setItem('backend_provider', provider);
}

/**
 * Get current active backend (runtime state)
 */
export function getActiveBackend(): BackendProvider {
  return activeBackend;
}

/**
 * Get base URL for current backend
 */
export function getBaseUrl(): string {
  return BACKENDS[activeBackend];
}