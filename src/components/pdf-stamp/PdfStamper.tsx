// src/components/pdf-stamp/PdfStamper.tsx

import { useEffect, useRef } from "react";
import { savePdfWorkflow } from "@/lib/backendApi";

type Props = {
  fileUrl: string;
  filename?: string; // already correct
};

export default function PdfStamper({ fileUrl, filename }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);

  // =========================
  // prevent duplicate saves
  // =========================
  const hasSavedOriginalRef = useRef(false);
  const hasSavedEditedRef = useRef(false);

  // =========================
  // persistent document identity
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

    // reset per file change
    hasSavedOriginalRef.current = false;
    hasSavedEditedRef.current = false;

    const documentId = documentIdRef.current;

    let refreshToolbar = () => {};

    NutrientViewer.load({
      container,
      document: fileUrl,
      ui: {
        showToolbar: true,
        showStampButton: true,
        showDrawButton: false,
        showSignButton: false,
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // =========================
      // auto-open stamp tool
      // =========================
      instance.setViewState((viewState: any) =>
        viewState.set(
          "interactionMode",
          NutrientViewer.InteractionMode.STAMP_PICKER
        )
      );

      // enable history
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
      // BACK BUTTON
      // =========================
      const backButton = {
        type: "custom",
        id: "go-back",
        title: "Back",
        onPress: () => window.history.back(),
      };

      // =========================
      // UNDO
      // =========================
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

      // =========================
      // REDO
      // =========================
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

      // =========================
      // STAMP BUTTON
      // =========================
      const stampButton = {
        type: "custom",
        id: "stamp-tool",
        title: "Stamp PDF",
        onPress: () => {
          instance.setViewState((viewState: any) =>
            viewState.set(
              "interactionMode",
              NutrientViewer.InteractionMode.STAMP_PICKER
            )
          );
        },
      };

      // =========================
      // DOWNLOAD (FIXED)
      // =========================
      const downloadButton = {
        type: "custom",
        id: "download",
        title: "Download",
        onPress: async () => {
          try {
            instance.setViewState((v: any) =>
              v.set("interactionMode", null)
            );

            await instance.save();

            const pdfBuffer = await instance.exportPDF();

            const blob = new Blob([pdfBuffer], {
              type: "application/pdf",
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // ✅ FIX: use real filename instead of blob parsing
            const outputName = filename || "document.pdf";
            a.download = outputName;

            a.click();
            URL.revokeObjectURL(url);

            if (!hasSavedEditedRef.current) {
              hasSavedEditedRef.current = true;

              const fileBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              await savePdfWorkflow({
                filename: outputName,
                fileBase64,
                action: "stamp",
                workflow_type: "stamp",
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
          stampButton,
          downloadButton,

          { type: "spacer" },
          ...rightItems,
        ];
      };

      refreshToolbar = () => {
        instance.setToolbarItems(buildToolbar(originalDefaultItems));
      };

      instance.setToolbarItems((defaultItems: any[]) => {
        originalDefaultItems = [...defaultItems];
        return buildToolbar(defaultItems);
      });

      instance.on("annotationsChanged", refreshToolbar);
    });

    // cleanup
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