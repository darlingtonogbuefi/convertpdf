// src/components/pdf-watermark/PdfViewer.tsx

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

type PdfViewerProps = {
  url: string;
  fileName: string;
};

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ url, fileName }: PdfViewerProps) {
  const isMobile =
    typeof window !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const onDocumentLoadSuccess = (doc: { numPages: number }) => {
    setNumPages(doc.numPages);
  };

  // Track container width (for optional gentle scaling)
  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => {
      setContainerWidth(containerRef.current!.offsetWidth);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Optional: subtle scaling only (prevents huge zoom-in issues)
  const scale = Math.min(containerWidth / 800, 1);

  return (
    <div
      ref={containerRef}
      className="
        flex-1
        w-full
        overflow-auto
        bg-gray-50
        relative
        min-h-[calc(100vh-2.5rem)]
        sm:min-h-0
      "
    >
      {isMobile ? (
        pdfError ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <p className="text-gray-700">Unable to preview PDF.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Download PDF
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-4">
            <Document
              key={url} // 🔥 ensures clean reset between PDFs
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                setPdfError(true);
              }}
              loading={
                <div className="text-sm text-gray-600">
                  Loading {fileName}...
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  scale={scale} // 🔥 FIX: prevents forced zoom-in / zoom-out
                  className="shadow-sm bg-white"
                />
              ))}
            </Document>
          </div>
        )
      ) : (
        <iframe
          key={url} // 🔥 resets viewer state per document
          src={`${url}#zoom=100`}
          className="w-full h-full border"
          title="PDF Viewer"
        />
      )}
    </div>
  );
}