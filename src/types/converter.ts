// src/types/converter.ts

export type ConversionType =
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'image-to-word'
  | 'image-to-excel'
  | 'word-to-excel'
  | 'pdf-to-powerpoint'
  | 'pdf-split'
  | 'pdf-merge'
  | 'pdf-compress'
  | 'pdf-watermark'
  | 'pdf-rotate'
  | 'pdf-sign'
  | 'pdf-stamp'
  | 'pdf-edit';

export interface ConversionOption {
  id: ConversionType;
  label: string;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  icon: string;
  available: boolean;
  outputOptions?: string[];
}

export interface ConvertedFile {
  name: string;
  url: string;
  blob: Blob;
  original_filename?: string;
}

// ✅ FIXED: added merging
export type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'converting'
  | 'splitting'
  | 'compressing'
  | 'rotating'
  | 'merging'
  | 'complete'
  | 'error';