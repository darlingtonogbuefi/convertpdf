// src/pages/pdfsign.tsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PdfSigner from "@/components/pdf-sign/PdfSigner";

export default function PdfSign() {
  const location = useLocation();

  const file: File | undefined = location.state?.file;

  // ✅ FIX: extract filename for consistent naming across workflows
  const filename: string | undefined = location.state?.filename;

  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Create browser URL for uploaded PDF
  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return <p>No PDF file provided.</p>;
  if (!fileUrl) return <p>Loading PDF…</p>;

  // ✅ FIX: pass filename into PdfSigner (for consistent download/save naming)
  return <PdfSigner fileUrl={fileUrl} filename={filename} />;
}