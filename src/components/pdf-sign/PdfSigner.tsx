// src/components/pdf-sign/PdfSigner.tsx

import { useEffect, useRef } from "react";
import { savePdfWorkflow } from "@/lib/backendApi";

type Props = {
  fileUrl: string;
  filename?: string; // ✅ FIX: added filename support
};

export default function PdfSigner({ fileUrl, filename }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);

  // =========================
  // Prevent duplicate saves
  // =========================
  const hasSavedOriginalRef = useRef(false);
  const hasSavedSignedRef = useRef(false);

  // =========================
  // Persistent document identity
  // =========================
  const documentIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const container = viewerRef.current;
    const { NutrientViewer } = window as any;

    if (!container || !NutrientViewer) {
      console.error("NutrientViewer SDK not loaded");
      return;
    }

    let instance: any;
    let originalDefaultItems: any[] = [];

    // reset per load
    hasSavedOriginalRef.current = false;
    hasSavedSignedRef.current = false;

    const documentId = documentIdRef.current;

    let refreshToolbar = () => {};

    NutrientViewer.load({
      container,
      document: fileUrl,
      ui: {
        showToolbar: true,
        showSignButton: true,
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // 🔹 Auto-open signature tool
      instance.setViewState((viewState: any) =>
        viewState.set(
          "interactionMode",
          NutrientViewer.InteractionMode.SIGNATURE
        )
      );

      // 🔹 Enable history
      instance.history.enable();

      // =========================
      // SAVE ORIGINAL ONCE
      // =========================
      const saveOriginal = async () => {
        if (hasSavedOriginalRef.current) return;
        hasSavedOriginalRef.current = true;

        try {
          const res = await fetch(fileUrl);
          const blob = await res.blob();

          const fileBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          await savePdfWorkflow({
            filename: "original.pdf",
            fileBase64,
            action: "upload",
            workflow_type: "upload",
            document_id: documentId,
          });
        } catch (err) {
          console.error("Original save failed:", err);
        }
      };

      saveOriginal();

      // =========================
      // CUSTOM BUTTONS
      // =========================

      const backButton = {
        type: "custom",
        id: "go-back",
        title: "Back",
        onPress: () => window.history.back(),
      };

      const undoButton = {
        type: "custom",
        id: "undo",
        title: "Undo",
        onPress: async () => {
          if (instance.history.canUndo()) {
            await instance.history.undo();
            refreshToolbar();
          }
        },
      };

      const redoButton = {
        type: "custom",
        id: "redo",
        title: "Redo",
        onPress: async () => {
          if (instance.history.canRedo()) {
            await instance.history.redo();
            refreshToolbar();
          }
        },
      };

      const signButton = {
        type: "custom",
        id: "sign",
        title: "Sign PDF",
        onPress: () => {
          try {
            instance.setViewState((viewState: any) =>
              viewState.set(
                "interactionMode",
                NutrientViewer.InteractionMode.SIGNATURE
              )
            );
          } catch (err) {
            console.error("Error opening signature tool:", err);
          }
        },
      };

      // =========================
      // DOWNLOAD BUTTON (FIXED)
      // =========================
      const downloadButton = {
        type: "custom",
        id: "download",
        title: "Download",
        onPress: async () => {
          try {
            console.log("DOWNLOAD CLICKED");

            const pdfBuffer = await instance.exportPDF();

            const blob = new Blob([pdfBuffer], {
              type: "application/pdf",
            });

            // =========================
            // LOCAL DOWNLOAD
            // =========================
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // ✅ FIX: use real filename
            const outputName = filename || "document.pdf";
            a.download = outputName;

            a.click();
            URL.revokeObjectURL(url);

            console.log("SENDING TO BACKEND...");

            // =========================
            // SAVE SIGNED FILE ONLY ONCE
            // =========================
            if (!hasSavedSignedRef.current) {
              hasSavedSignedRef.current = true;

              const fileBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              await savePdfWorkflow({
                filename: outputName, // ✅ FIX
                fileBase64,
                action: "sign",
                workflow_type: "sign",
                document_id: documentId,
              });
            }
          } catch (err) {
            console.error("Download failed:", err);
          }
        },
      };

      // =========================
      // TOOLBAR BUILDER
      // =========================
      const buildToolbar = (defaultItems: any[]) => {
        const half = Math.ceil(defaultItems.length / 2);
        const leftItems = defaultItems.slice(0, half);
        const rightItems = defaultItems.slice(half);

        return [
          ...leftItems,
          { type: "spacer" },

          backButton,
          undoButton,
          redoButton,
          signButton,
          downloadButton,

          { type: "spacer" },
          ...rightItems,
        ];
      };

      const refreshToolbar = () => {
        instance.setToolbarItems(buildToolbar(originalDefaultItems));
      };

      instance.setToolbarItems((defaultItems: any[]) => {
        originalDefaultItems = [...defaultItems];
        return buildToolbar(defaultItems);
      });

      instance.on("annotationsChanged", refreshToolbar);
    });

    // Cleanup
    return () => {
      if (instance) {
        NutrientViewer.unload(container);
      }
    };
  }, [fileUrl, filename]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "100vh",
      }}
    />
  );
}