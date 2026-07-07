// src/components/ConversionProgress.tsx

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Download, RotateCw } from 'lucide-react';
import type { ConversionStatus, ConvertedFile, ConversionType } from '@/types/converter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConversionProgressProps {
  status: ConversionStatus;
  progress: number;
  convertedFiles: ConvertedFile[];
  error?: string;
  onDownload: (file: ConvertedFile) => void;
  onDownloadAll: () => void;
  conversionType?: ConversionType;
}

export function ConversionProgress({
  status,
  progress,
  convertedFiles,
  error,
  onDownload,
  onDownloadAll,
  conversionType,
}: ConversionProgressProps) {
  if (status === 'idle') return null;

  // ✅ FIXED: correct labels
  const statusLabelMap: Record<ConversionStatus, string> = {
    uploading: 'Uploading...',
    converting: 'Converting...',
    splitting: 'Splitting PDF...',
    compressing: 'Compressing PDF...',
    rotating: 'Rotating PDF...',
    merging: 'Merging PDF...',
    complete: '',
    error: '',
    idle: '',
  };

  const isInProgress = [
    'uploading',
    'converting',
    'splitting',
    'compressing',
    'rotating',
    'merging',
  ].includes(status);

  const isRotating = conversionType === 'pdf-rotate';

  // ✅ NEW: 3 minute timeout
  const TIME_LIMIT = 180; // 3 minutes

  // ✅ NEW: auto-fail state
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // ✅ NEW: timeout effect
  useEffect(() => {
    if (!isInProgress) {
      setHasTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      setHasTimedOut(true);
    }, TIME_LIMIT * 1000);

    return () => clearTimeout(timeout);
  }, [isInProgress]);

  const getDisplayName = (file: ConvertedFile, index: number) => {
    if (convertedFiles.length > 1) {
      const originalName = file.name ?? 'converted-file';
      const dotIndex = originalName.lastIndexOf('.');
      const name = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
      const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';
      return `${name}_page_${index + 1}${ext}`;
    }
    return file.name ?? 'converted-file';
  };

  const previewFiles =
    convertedFiles.length > 10 ? convertedFiles.slice(0, 10) : convertedFiles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      {/* Progress */}
      {isInProgress && !hasTimedOut && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRotating ? (
                <RotateCw className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              )}

              <span className="text-sm font-medium text-foreground">
                {statusLabelMap[status]}
              </span>
            </div>

            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'complete' && convertedFiles.length > 0 && !hasTimedOut && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-secondary/10 border border-secondary/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <span className="font-display font-semibold text-foreground">
              Conversion Complete!
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {previewFiles.map((file, index) => (
              <motion.div
                key={file.name + index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-background/50 rounded-xl p-3"
              >
                <span className="text-sm text-foreground truncate flex-1 mr-3">
                  {getDisplayName(file, index)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fileToDownload =
                      convertedFiles.length > 1
                        ? { ...file, name: getDisplayName(file, index) }
                        : file;
                    onDownload(fileToDownload);
                  }}
                  className="shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </motion.div>
            ))}

            {convertedFiles.length > 10 && (
              <div className="text-sm text-muted-foreground mt-1">
                +{convertedFiles.length - 10} more files not shown
              </div>
            )}
          </div>

          {convertedFiles.length > 1 && (
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
              onClick={onDownloadAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All (ZIP)
            </Button>
          )}
        </motion.div>
      )}

      {/* Error */}
      {(status === 'error' || hasTimedOut) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="font-medium text-foreground">
              Conversion Failed
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {hasTimedOut
              ? 'Something happened, try again later.'
              : error || 'An unexpected error occurred. Please try again.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}