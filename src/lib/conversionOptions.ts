// src/lib/conversionOptions.ts

import type { ConversionType } from '@/types/converter';
import {
  FileImage,
  FileText,
  FileSpreadsheet,
  Scissors,
  Minimize2,
  PenTool,
  Stamp,
  Edit3,
  Layers,
  RotateCw,
  Droplets,
  Presentation
} from 'lucide-react';

export interface ConversionOption {
  id: ConversionType;
  label: string;
  inputFormats: string[];
  outputFormat: string;
  outputOptions?: (string | { label: string; angle?: number })[];
  available?: boolean;
  description?: string;
  usePopup?: boolean;
  icon?: React.ComponentType<{ className?: string }>; // ✅ ADDED ONLY THIS
}

export const conversionOptions: ConversionOption[] = [

  {
    id: 'pdf-to-word',
    label: 'PDF to Word',
    icon: FileText, 
    description: 'Convert PDF documents to editable Word files.',
    inputFormats: ['PDF'],
    outputFormat: 'Word',
  },

  {
    id: 'pdf-watermark',
    label: 'Watermark PDF',
    icon: Droplets,
    description: 'Apply a watermark to your PDF document.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true,
  },

  {
    id: 'pdf-edit',
    label: 'Edit PDF',
    icon: Edit3,
    description: 'Edit or delete text in PDF documents.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true,
  },

  {
    id: 'pdf-to-powerpoint',
    label: 'PDF to PPT',
    icon: Presentation,
    description: 'Convert PDF documents into editable PPT slides.',
    inputFormats: ['PDF'],
    outputFormat: 'PowerPoint',
  },

  {
    id: 'pdf-sign',
    label: 'Sign PDF',
    icon: PenTool,
    description: 'Add a digital signature to a PDF.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true,
  },

  {
    id: 'pdf-compress',
    label: 'Compress PDF',
    icon: Minimize2,
    description: 'Reduce the size of PDF files.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },

  {
    id: 'image-to-pdf',
    label: 'Image to PDF',
    icon: FileImage,
    description: 'Convert image files into PDFs.',
    inputFormats: ['png', 'jpg', 'jpeg'],
    outputFormat: 'PDF',
  },

  {
    id: 'pdf-stamp',
    label: 'Stamp PDF',
    icon: Stamp,
    description: 'Apply a stamp (like "Approved") to PDFs.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true,
  },

  {
    id: 'pdf-merge',
    label: 'Merge PDF',
    icon: Layers,
    description: 'Combine multiple PDF files into one.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },

  {
    id: 'pdf-to-image',
    label: 'PDF to Image',
    icon: FileText,
    description: 'Extract each page of a PDF as an image.',
    inputFormats: ['PDF'],
    outputFormat: 'JPG',
    outputOptions: [
      { label: 'JPG' },
      { label: 'PNG' },
    ],
  },

  {
    id: 'pdf-to-excel',
    label: 'PDF to Excel',
    icon: FileSpreadsheet,
    description: 'Convert PDF tables into Excel.',
    inputFormats: ['pdf'],
    outputFormat: 'Excel',
  },

  {
    id: 'pdf-split',
    label: 'Split PDF',
    icon: Scissors,
    description: 'Split a PDF into multiple smaller PDF files.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },

  {
    id: 'image-to-word',
    label: 'Image to Word',
    icon: FileImage,
    description: 'Convert images with text into Word documents.',
    inputFormats: ['png', 'jpg'],
    outputFormat: 'Word',
  },

  {
    id: 'pdf-rotate',
    label: 'Rotate PDF',
    icon: RotateCw,
    description: 'Rotate pages of a PDF document.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    outputOptions: [
      { label: '90°', angle: 90 },
      { label: '270°', angle: 270 },
      { label: '180°', angle: 180 },
    ],
  },

  {
    id: 'image-to-excel',
    label: 'Image to Excel',
    icon: FileImage,
    description: 'Extract tables from images into Excel.',
    inputFormats: ['png', 'jpg'],
    outputFormat: 'Excel',
  },

  
  {
    id: 'word-to-excel',
    label: 'Word to Excel',
    icon: FileSpreadsheet,
    description: 'Convert Word tables into Excel.',
    inputFormats: ['doc', 'docx'],
    outputFormat: 'Excel',
  },
];