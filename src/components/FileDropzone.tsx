//   src\components\FileDropzone.tsx

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileIcon,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { msalInstance } from "@/auth/authProvider";

// NEW
import { LoginRequiredDialog } from "./LoginRequiredDialog";

interface FileDropzoneProps {
  acceptedFormats?: string[];
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  forceHighlight?: boolean;
}

export function FileDropzone({
  acceptedFormats,
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  maxFiles = 10,
  forceHighlight,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  const normalizedFormats = (acceptedFormats ?? []).map(f =>
    f.startsWith(".") ? f.toLowerCase() : `.${f.toLowerCase()}`
  );

  const isValidFile = (file: File) => {
    if (!normalizedFormats.length) return true;
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    return normalizedFormats.includes(ext);
  };

  const resetFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRequireLogin = () => {
    sessionStorage.setItem(
      "postLoginRedirect",
      window.location.pathname
    );

    setShowLoginModal(true);
  };

  const handleLoginModalChange = (open: boolean) => {
    setShowLoginModal(open);

    if (!open) {
      setError(null);
      resetFileInput();
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      setIsDragging(false);
      setError(null);

      const allFiles = Array.from(e.dataTransfer.files);

      const files = allFiles
        .filter(isValidFile)
        .slice(0, maxFiles);

      const isLoggedIn =
        msalInstance.getAllAccounts().length > 0;

      // 👉 Auth users bypass restriction completely
      if (!isLoggedIn) {
        const hasLargeFile = files.some(
          file => file.size > MAX_FILE_SIZE
        );

        if (hasLargeFile) {
          setError("Files larger than 1MB require sign in.");
          handleRequireLogin();
          resetFileInput();
          return;
        }
      }

      if (files.length) {
        onFilesSelected(files);
      }
    },
    [maxFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);

      const allFiles = Array.from(e.target.files ?? []);

      const files = allFiles
        .filter(isValidFile)
        .slice(0, maxFiles);

      const isLoggedIn =
        msalInstance.getAllAccounts().length > 0;

      // 👉 IMPORTANT: Auth users bypass size restriction completely
      if (!isLoggedIn) {
        const hasLargeFile = files.some(
          file => file.size > MAX_FILE_SIZE
        );

        if (hasLargeFile) {
          setError("Files larger than 1MB require sign in.");
          handleRequireLogin();
          resetFileInput();
          return;
        }
      }

      if (files.length) {
        onFilesSelected(files);
      }

      resetFileInput();
    },
    [maxFiles, onFilesSelected]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* LOGIN MODAL */}
      <LoginRequiredDialog
        open={showLoginModal}
        onOpenChange={handleLoginModalChange}
      />

      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-2 transition-all cursor-pointer",
          "flex flex-col items-center justify-center text-center min-h-[100px]",
          isDragging || forceHighlight
            ? "border-primary bg-muted/40"
            : "border-border hover:border-primary hover:bg-muted/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={normalizedFormats.join(",")}
          onChange={handleFileInput}
          multiple={maxFiles > 1}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="p-4 bg-muted rounded-2xl">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>

        <p className="text-sm text-center text-muted-foreground flex flex-wrap items-center justify-center gap-2">
          <span className="font-semibold text-foreground">
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </span>

          {!isDragging && (
            <>
              <span>or click to</span>

              <span className="text-primary font-bold">
                browse
              </span>
            </>
          )}

          {/* formats moved inline */}
          {/* {normalizedFormats.map(format => (
            <span
              key={format}
              className="text-xs bg-muted px-2 py-1 rounded-md"
            >
              {format.toUpperCase()}
            </span>
          ))} */}
        </p>

        {error && (
          <p className="text-sm text-red-500 font-medium mt-3">
            {error}
          </p>
        )}
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {selectedFiles.length} file selected
            </p>

            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex justify-between items-center bg-muted/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="w-4 h-4 text-primary" />

                  <div className="truncate">
                    <p className="text-sm font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}