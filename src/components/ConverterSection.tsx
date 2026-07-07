// src/components/ConverterSection.tsx

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { conversionOptions } from '@/lib/conversionOptions';
import { ConversionCard } from './ConversionCard';
import { getConversionHistory } from "@/lib/getConversionHistory";
import ConversionHistory from './ConversionHistory';
import { ConversionTypePopup } from './ConversionTypePopup';
import type {
  ConversionType,
  ConversionStatus,
  ConvertedFile,
} from '@/types/converter';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type NavigationState = {
  selectedType?: ConversionType;
  quickAction?: boolean;
  quickActionType?: ConversionType;
};

/* =========================================================
   EXISTING SCROLL FUNCTION (DO NOT MODIFY)
========================================================= */
export const scrollToHeroSection = () => {
  const el = document.getElementById("hero-section");

  if (!el) return;

  const top =
    el.getBoundingClientRect().top +
    window.scrollY;

  window.scrollTo({
    top,
    behavior: "smooth",
  });

  window.dispatchEvent(new Event("highlight-dropzone"));
};

/* =========================================================
   NEW SCROLL FUNCTION (ONLY FOR QUICK ACTIONS)
========================================================= */
export const scrollToHeroUploadTop = () => {
  const hero = document.getElementById("dashboard-hero");

  if (!hero) return;

  const top =
    hero.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top,
    behavior: "smooth",
  });

  window.dispatchEvent(new Event("highlight-dropzone"));
};

export function ConverterSection({
  selectedType,
  onSelectType,
  onConfirmType,
  showTypePopup,
  status,
  progress,
  convertedFiles,
  onReset,
  onTabChange,
}: any) {

  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'convert' | 'history'>('convert');

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const [conversionHistory, setConversionHistory] = useState<any[]>(() =>
    getConversionHistory()
  );
  const lastActionRef = useRef<ConversionType | null>(null);

  /**
   * =========================================================
   * 1. HANDLE NAVIGATION STATE (selection ONLY)
   * =========================================================
   */
  useEffect(() => {
    const state = location.state as NavigationState | null;
    if (!state) return;

    if (state.quickAction && state.quickActionType) {
      onSelectType(state.quickActionType);

      // ✅ UPDATED: use NEW scroll function
      scrollToHeroUploadTop();

      return;
    }

    if (state.selectedType) {
      onSelectType(state.selectedType);
    }
  }, [location.state]);

  /**
 * =========================================================
 * 2. SCROLL + HIGHLIGHT (quick action UX)
 * =========================================================
 */
  const quickActionHandled = useRef(false);

  useEffect(() => {
    const state = location.state as NavigationState | null;

    if (!state?.quickAction || !state.quickActionType) {
      quickActionHandled.current = false;
      return;
    }

    // Prevent repeated highlighting for the same navigation
    if (quickActionHandled.current) return;

    quickActionHandled.current = true;

    const type = state.quickActionType;

    const id = requestAnimationFrame(() => {
      scrollToHeroUploadTop();

      window.dispatchEvent(
        new CustomEvent("highlight-conversion-card", {
          detail: type,
        })
      );
    });

    return () => cancelAnimationFrame(id);
  }, [location.state]);

  /**
 * =========================================================
 * 3. MANUAL SELECTION SCROLL
 * =========================================================
 */
  useEffect(() => {
    // Reset tracking when a card is unselected
    if (!selectedType) {
      lastActionRef.current = null;
      return;
    }

    if (lastActionRef.current === selectedType) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHeroSection();
        lastActionRef.current = selectedType;
      });
    });

    return () => cancelAnimationFrame(id);
  }, [selectedType]);

  /**
   * =========================================================
   * 4. HISTORY STORAGE
   * =========================================================
   */
  useEffect(() => {
    if (!selectedType || convertedFiles.length === 0) return;

    const mappedHistory = convertedFiles.map((file, index) => {
      const parts = selectedType.split('-');

      return {
        id: `${Date.now()}-${index}`,
        status: 'completed',
        original_filename:
          file.name ?? `converted.${parts.at(-1)?.toLowerCase()}`,
        file,
        source_format: parts[0]?.toUpperCase() ?? 'UNKNOWN',
        target_format: parts.at(-1)?.toUpperCase() ?? 'UNKNOWN',
        created_date: new Date().toISOString(),
      };
    });

    setConversionHistory(prev => {
      const updated = [...mappedHistory, ...prev];
      localStorage.setItem('conversionHistory', JSON.stringify(updated));
      window.dispatchEvent(new Event("conversion-history-updated"));
      return updated;
    });
  }, [convertedFiles, selectedType]);

  /**
   * =========================================================
   * DOWNLOAD HANDLERS
   * =========================================================
   */
  const handleDownload = (file: ConvertedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name || 'file';
    a.click();
  };

  const handleClearHistory = () => {
    setConversionHistory([]);
    localStorage.removeItem('conversionHistory');
    toast('Conversion history cleared');
  };

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">

      {/* TABS */}
      <div className="max-w-xs mx-auto bg-gray-200 rounded-md p-1 mb-3">
        <div className="grid grid-cols-2 gap-1">

          <button
            onClick={() => setActiveTab('convert')}
            className={`text-sm font-semibold rounded-md transition-colors ${activeTab === 'convert'
              ? 'bg-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            Convert File
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`text-sm font-semibold rounded-md transition-colors ${activeTab === 'history'
              ? 'bg-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
              }`}
          >
            History
          </button>

        </div>
      </div>

      {/* CONVERT */}
      {activeTab === 'convert' && (
        <>
          <div className="grid grid-cols-4 gap-4 mt-6 mb-6">

            {conversionOptions.map(option => (
              <div key={option.id} className="flex justify-center">
                <ConversionCard
                  option={option}
                  index={0}
                  selectedType={selectedType}
                  isSelected={selectedType === option.id}
                  onClick={() => {
                    const isSame = selectedType === option.id;
                    onSelectType(isSame ? undefined : option.id);
                  }}
                />
              </div>
            ))}

          </div>

          {showTypePopup && (
            <ConversionTypePopup
              onConfirmType={onConfirmType}
              onClose={onReset}
            />
          )}
        </>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="mt-6">
          <ConversionHistory
            conversions={conversionHistory}
            isLoading={status === 'converting'}
            onDownload={handleDownload}
            onClearHistory={handleClearHistory}
          />
        </div>
      )}

    </section>
  );
}