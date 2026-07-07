// src/pages/Index.tsx

import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from '@/components/HeroSection';
import { ConverterSection } from '@/components/ConverterSection';
import { conversionOptions } from '@/lib/conversionOptions';
import type { ConversionType, ConversionStatus, ConvertedFile } from '@/types/converter';
import { convertWithBackend, ConversionEndpoint, uploadFile } from '@/lib/backendApi';
import Footer from '@/components/Footer';

export default function Index() {
  const defaultType: ConversionType = 'pdf-watermark';

  const [selectedType, setSelectedType] = useState<ConversionType | null>(null);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showTypePopup, setShowTypePopup] = useState(false);

  const location = useLocation();
  const [reusedFiles, setReusedFiles] = useState<File[]>([]);

  // ✅ NEW: tracks whether hero should collapse (mobile only)
  const [inHistory, setInHistory] = useState(false);

  // ✅ NEW: detect mobile only (desktop ignores hero collapse)
  const [isMobile, setIsMobile] = useState(false);

  /**
   * MOBILE DETECTION
   */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  /**
   * INTERSECTION OBSERVER (mobile-only behavior)
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMobile) {
          console.log(
            "History observer:",
            entry.isIntersecting,
            entry.target
          );

          setInHistory(entry.isIntersecting);
        }
      },
      {
        threshold: 0.2,
      }
    );

    let element: HTMLElement | null = null;
    let interval: NodeJS.Timeout | null = null;
    let attached = false;

    const tryAttach = () => {
      element = document.getElementById("recent-conversions");

      if (element && !attached) {
        observer.observe(element);
        attached = true;
        return true;
      }
      return false;
    };

    // initial attempt
    if (tryAttach()) return;

    // retry for late DOM mount (mobile-safe)
    interval = setInterval(() => {
      if (tryAttach()) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [isMobile]);

  /**
   * HANDLE REUSED FILE NAVIGATION
   */
  useEffect(() => {
    const state = location.state as any;

    if (!state?.reusedFile) return;

    setReusedFiles([state.reusedFile]);
    setPendingFiles([state.reusedFile]);

    const timer = setTimeout(() => {
      setShowTypePopup(true);

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("highlight-dropzone"));
      });
    }, 100);

    window.history.replaceState({}, "");

    return () => clearTimeout(timer);
  }, [location.state]);

  /**
   * POPUP HANDLER (storage + event fallback)
   */
  useEffect(() => {
    const openPopupFromStorage = () => {
      const shouldOpen =
        sessionStorage.getItem("openPopupAfterNav") === "1";

      if (!shouldOpen) return;

      sessionStorage.removeItem("openPopupAfterNav");

      setShowTypePopup(true);
    };

    const handler = () => openPopupFromStorage();

    window.addEventListener("open-conversion-popup", handler);

    openPopupFromStorage();

    return () => {
      window.removeEventListener("open-conversion-popup", handler);
    };
  }, []);

  const selectedOption = selectedType
    ? conversionOptions.find(o => o.id === selectedType)!
    : { inputFormats: [] };

  // Called when files are selected
  const handleFilesSelected = async (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string | number
  ): Promise<ConvertedFile[]> => {
    if (!files.length) return [];

    if (!selectedType) {
      setPendingFiles(files);
      setShowTypePopup(true);
      return [];
    }

    return handleConvert(files, setProgress, setStatus, outputOption);
  };

  const handleConvert = async (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string | number
  ): Promise<ConvertedFile[]> => {
    if (!files.length || !selectedType) return [];

    setProgress?.(0);

    try {
      if (selectedType === 'pdf-edit') {
        const response = await uploadFile('/pdf-edit/extract', files[0]);
        console.log('PDF Edit extracted pages:', response.pages);
        setStatus?.('idle');
        return [];
      }

      const endpointMap: { [K in ConversionType]?: ConversionEndpoint } = {
        'image-to-pdf': 'imageToPdf',
        'pdf-to-image': 'pdfToImage',
        'pdf-to-word': 'pdfToWord',
        'pdf-to-excel': 'pdfToExcel',
        'pdf-to-powerpoint': 'pdfToPpt',
        'image-to-word': 'imageToWord',
        'image-to-excel': 'imageToExcel',
        'word-to-excel': 'wordToExcel',
        'pdf-split': 'pdfSplit',
        'pdf-merge': 'pdfMerge',
        'pdf-compress': 'pdfCompress',
        'pdf-watermark': 'pdfWatermark',
        'pdf-rotate': 'pdfRotate',
        'pdf-sign': 'pdfSign',
        'pdf-stamp': 'pdfStamp',
      };

      const endpoint = endpointMap[selectedType];
      if (!endpoint) throw new Error('Unsupported conversion type');

      const options: Record<string, any> = {};

      if (typeof outputOption === 'string') {
        options.format = outputOption.toLowerCase();
      }

      if (typeof outputOption === 'number') {
        options.angle = outputOption;
      }

      const rawResult = await convertWithBackend(
        files,
        endpoint,
        options,
        setProgress
      );

      // =====================================================
      // SAFE OUTPUT NORMALIZATION PER CONVERSION TYPE
      // =====================================================

      let result: ConvertedFile[] = [];

      if (selectedType === "pdf-merge") {
        // merge MUST always be single output
        const single = Array.isArray(rawResult)
          ? rawResult[0]
          : rawResult;

        if (single) {
          result = [single];
        }
      } else {
        // all other converters may return arrays
        result = Array.isArray(rawResult)
          ? rawResult
          : [rawResult];
      }

      setConvertedFiles(result);
      setProgress?.(100);

      return result;

    } catch (err: any) {
      alert(err.message || 'Conversion failed');
      return [];
    }
  };

  const handleConfirmType = async (type: ConversionType) => {
    setSelectedType(type);
    setShowTypePopup(false);

    if (pendingFiles.length) {
      await handleConvert(pendingFiles);
      setPendingFiles([]);
    }
  };

  const handleClosePopup = () => {
    setShowTypePopup(false);
    setPendingFiles([]);
    if (!selectedType) setSelectedType(defaultType);
  };

  const handleSelectType = (type?: ConversionType) => {
    setSelectedType(type ?? null);
  };

  return (
    <>
      <HeroSection
        acceptedFormats={selectedOption.inputFormats}
        disabled={status === 'converting'}
        selectedType={selectedType ?? undefined}
        onConvert={handleFilesSelected}
        onReset={handleClosePopup}
        onOpenPopup={() => setShowTypePopup(true)}
        inHistory={inHistory}
        initialFiles={reusedFiles}
      />

      <ConverterSection
        selectedType={selectedType ?? undefined}
        onSelectType={handleSelectType}
        onConfirmType={handleConfirmType}
        showTypePopup={showTypePopup}
        status={status}
        progress={progress}
        convertedFiles={convertedFiles}
        onReset={handleClosePopup}
        onTabChange={(tab: "convert" | "history") => {
          setInHistory(isMobile && tab === "history");
        }}
      />

      <Footer />
    </>
  );
}