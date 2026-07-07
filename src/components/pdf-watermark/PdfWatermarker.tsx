// src/components/pdf-watermark/PdfWatermarker.tsx

import { useRef, useState } from "react";
import { pdfWatermark } from "@/lib/converters";
import { Button } from "@/components/ui/button";

type Props = {
  file: File;
  watermarkType: "text" | "image";
  watermarkText: string;
  watermarkFile: File | null;
  gridOptions: {
    tile_type: "straight" | "diagonal";
    horizontal_boxes: number;
    vertical_boxes: number;
  };
  textOpacity?: number;
  imageOpacity?: number;
  documentId: string;
  onComplete: (url: string) => void;
};

export default function PdfWatermarker({
  file,
  watermarkType,
  watermarkText,
  watermarkFile,
  gridOptions,
  textOpacity = 0.5,
  imageOpacity = 0.5,
  documentId,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(false);

  // =====================================================
  // Persistent document identity (frontend session ID)
  // Backend may override or generate its own if missing
  // =====================================================
  //const documentIdRef = useRef<string>(crypto.randomUUID());

  const handleApplyWatermark = async () => {
    setLoading(true);

    const MAX_SIZE = 40 * 1024 * 1024; // 40MB safe limit

    if (file.size > MAX_SIZE) {
      alert("File too large. Please upload under 40MB.");
      setLoading(false);
      return;
    }

    if (watermarkFile && watermarkFile.size > MAX_SIZE) {
      alert("Watermark image too large.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        watermark:
          watermarkType === "text"
            ? {
                type: "text",
                text: watermarkText,
                font: "Helvetica",
                font_size: 60,
                color: "#000000",
                opacity: textOpacity,
                angle: 45,
                save_as_image: false,
                dpi: 300,
              }
            : {
                type: "image",
                opacity: imageOpacity,
                angle: 45,
                save_as_image: false,
                dpi: 300,
              },

        placement: {
          mode: "grid",
          tile_type: gridOptions.tile_type,
          horizontal_boxes: gridOptions.horizontal_boxes,
          vertical_boxes: gridOptions.vertical_boxes,
        },

        imageFile: watermarkFile || undefined,
      };

      // =====================================================
      // FIX: allow backend to generate document ID if missing
      // =====================================================
      //let documentId = documentIdRef.current;

      // safety fallback (DO NOT block request anymore)
      //if (!documentId || documentId === "undefined") {
      //  documentId = crypto.randomUUID();
      //  documentIdRef.current = documentId;
      //}

      const finalFile = await pdfWatermark(file, payload, documentId);

      onComplete(finalFile.url);

    } catch (err: any) {
      alert(err.message || "Failed to apply watermark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleApplyWatermark}
      disabled={loading}
      className="bg-gray-400 text-white hover:bg-gray-500"
    >
      {loading ? "Applying..." : "Apply Watermark"}
    </Button>
  );
}