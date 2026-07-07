// src/lib/backendApi.ts


import { getGuestId } from "@/utils/guestId";
import type { ConvertedFile } from '@/types/converter';
import { getBaseUrl } from '@/config/backend';
import { msalInstance } from "@/auth/authProvider";
import { API_SCOPE } from "@/auth/msalConfig";

interface BackendResponse {
  success: boolean;
  filename?: string;
  files?: string[];
  file?: string;
  images?: string[];
  ocr_text?: string;
  error?: string;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Supported MIME types
 */
const mimeTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain',
};

/**
 * Map endpoints to default output extensions
 */
const endpointExtensions: Record<string, string> = {
  imageToPdf: '.pdf',
  pdfSplit: '.pdf',
  pdfToWord: '.docx',
  pdfToPpt: '.pptx',
  wordToExcel: '.xlsx',
  pdfToExcel: '.xlsx',
  wordToPdf: '.pdf',
  excelToPdf: '.pdf',
  pdfStamp: '.pdf',
  pdfEdit: '.pdf',
};

/**
 * Backend API configuration
 * (endpoints only — baseUrl is now dynamic via getBaseUrl())
 */
export const API_CONFIG = {
  endpoints: {
    health: '/health',
    pdfToWord: '/api/convert/pdf-to-word',
    wordToPdf: '/api/convert/word-to-pdf',
    pdfToExcel: '/api/convert/pdf-to-excel',
    excelToPdf: '/api/convert/excel-to-pdf',
    pdfToImage: '/api/convert/pdf-to-image',
    imageToPdf: '/api/convert/image-to-pdf',
    imageToWord: '/api/convert/image-to-word',
    imageToExcel: '/api/convert/image-to-excel',
    wordToExcel: '/api/convert/word-to-excel',
    pdfSplit: '/api/convert/pdf-split',
    pdfMerge: '/api/convert/pdf-merge',
    pdfCompress: '/api/convert/pdf-compress',
    pdfWatermark: '/api/convert/pdf-watermark',
    pdfRotate: '/api/convert/pdf-rotate',
    pdfSign: '/api/convert/pdf-sign',
    pdfToPpt: '/api/convert/pdf-to-powerpoint',
    pdfStamp: '/api/convert/pdf-stamp',
    pdfEditExtract: '/pdf-edit/extract',
    pdfEditUpdate: '/pdf-edit/update',
    pdfWorkflowSave: '/api/pdf-workflow/save',
  }
};

export type ConversionEndpoint = keyof typeof API_CONFIG.endpoints;

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(
      `${getBaseUrl()}${API_CONFIG.endpoints.health}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function getAccessToken(): Promise<string | null> {
  const account =
    msalInstance.getActiveAccount() ??
    msalInstance.getAllAccounts()[0];

  if (!account) {
    return null; // 👈 allow anonymous
  }

  try {
    const tokenResponse =
      await msalInstance.acquireTokenSilent({
        account,
        scopes: [API_SCOPE],
      });

    return tokenResponse.accessToken;
  } catch (err) {
    console.warn("Token fetch failed, continuing as anonymous:", err);
    return null; // 👈 fallback to anonymous
  }
}


/**
 * Generic backend conversion handler (frontend calls backend only)
 */
export async function convertWithBackend(
  fileOrFiles: File | File[],
  endpoint: ConversionEndpoint,
  options: {
    ocr?: boolean;
    format?: string;
    start?: number;
    end?: number;
    select_pages?: string;
    compression_level?: string;
    recompress_images?: boolean;
    angle?: number;
    pdfName?: string;
  } = {},
  onProgress?: (progress: number) => void
): Promise<ConvertedFile | ConvertedFile[]> {

  const formData = new FormData();
  const filesArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

  // Append files according to endpoint requirements
  // =====================================================
// FIXED FILE UPLOAD NORMALIZATION (SAFE + CONSISTENT)
// =====================================================

const multiFileEndpoints = new Set([
  "imageToPdf",
  "pdfMerge",
]);

if (multiFileEndpoints.has(endpoint)) {
  // ALWAYS use "files" for multi-file endpoints
  filesArray.forEach(file => {
    formData.append("files", file);
  });
} else {
  // ALWAYS use "file" for single-file endpoints
  formData.append("file", filesArray[0]);
}

  // Append options
  if (options.ocr) formData.append('ocr', 'true');
  if (options.format && endpoint !== 'pdfRotate') formData.append('format', options.format);
  if (endpoint === 'pdfRotate' && options.angle !== undefined) {
    formData.append('angle', String(options.angle));
  }
  if (endpoint === 'imageToPdf') {
    const pdfName = options.pdfName || `${filesArray[0].name.split('.')[0]}.pdf`;
    formData.append('pdf_name', pdfName);
  }
  if (endpoint === 'pdfSplit') {
    formData.append('start', String(options.start ?? 1));
    if (options.end) formData.append('end', String(options.end));
  }
  if (endpoint === 'pdfCompress') {
    formData.append('compression_level', options.compression_level ?? 'max');
    formData.append('recompress_images', String(options.recompress_images ?? true));
    formData.append('select_pages', options.select_pages ?? '');
  }

  onProgress?.(10);

  // Call backend (dynamic AWS/Azure base URL)
  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "X-Guest-Id": getGuestId(),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${getBaseUrl()}${API_CONFIG.endpoints[endpoint]}`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  onProgress?.(70);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Conversion failed (${response.status})`);
  }

  const data: BackendResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Conversion failed');
  }

  onProgress?.(90);

  const results: ConvertedFile[] = [];
  const originalName = filesArray[0].name;

  // Files
  const base64Files = data.files ?? (data.file ? [data.file] : []);
  base64Files.forEach((base64File) => {
    const ext =
      endpointExtensions[endpoint] ||
      (options.format ? `.${options.format.toLowerCase()}` : '.bin');

    const blob = base64ToBlob(base64File, mimeTypes[ext] || 'application/octet-stream');
    const name = data.filename ? data.filename : originalName.replace(/\.[^/.]+$/, ext);

    results.push({ name, url: URL.createObjectURL(blob), blob });
  });

  // Images
  data.images?.forEach((img, idx) => {
    const ext = options.format ? `.${options.format.toLowerCase()}` : '.png';
    const blob = base64ToBlob(img, mimeTypes[ext] || 'image/png');

    results.push({
      name: `${originalName.split('.')[0]}_page_${idx + 1}${ext}`,
      url: URL.createObjectURL(blob),
      blob
    });
  });

  // OCR
  if (data.ocr_text) {
    const blob = base64ToBlob(data.ocr_text, 'text/plain');

    results.push({
      name: `${originalName.split('.')[0]}_ocr.txt`,
      url: URL.createObjectURL(blob),
      blob
    });
  }

  if (!results.length) throw new Error('Backend returned no files');

  onProgress?.(100);

  return results.length === 1 ? results[0] : results;
}

/**
 * Upload a PDF to extract or update text
 */
export async function uploadFile(
  endpoint: '/pdf-edit/extract' | '/pdf-edit/update',
  file: File,
  updates?: any[]
) {
  const formData = new FormData();
  formData.append('file', file);

  if (endpoint === '/pdf-edit/update' && updates) {
    formData.append('updates', JSON.stringify(updates));
  }

  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "X-Guest-Id": getGuestId(),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${getBaseUrl()}${endpoint}`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`PDF edit request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Shortcut for updating PDF text
 */
export async function updatePdfText(file: File, updates: any[]) {
  return uploadFile('/pdf-edit/update', file, updates);
}


// =====================================================
// PDF WORKFLOW SAVE (NEW)
// =====================================================

export async function savePdfWorkflow(params: {
  filename: string;
  fileBase64: string;

  // keep for logs / analytics (optional usage)
  action: "upload" | "edit" | "sign" | "stamp";

  document_id?: string;

  // 🔥 NEW SOURCE OF TRUTH FOR STORAGE
  workflow_type: "upload" | "edit" | "sign" | "stamp";
}) {


  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Guest-Id": getGuestId(),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${getBaseUrl()}${API_CONFIG.endpoints.pdfWorkflowSave}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        filename: params.filename,
        file_base64: params.fileBase64,

        // still sent (optional logging / debugging)
        action: params.action,

        document_id: params.document_id,

        // this is what backend MUST use for storage routing
        workflow_type: params.workflow_type,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Workflow save failed (${response.status})`);
  }

  return response.json();
}