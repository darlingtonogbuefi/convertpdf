// Backend API configuration
// Update this URL to point to your FastAPI backend
//  src\config\api.ts

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
  },
};

export type ConversionEndpoint = keyof typeof API_CONFIG.endpoints;