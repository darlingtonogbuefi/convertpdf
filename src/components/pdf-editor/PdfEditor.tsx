// src/components/pdf-editor/PdfEditor.tsx

import { useEffect, useRef } from "react";
import { savePdfWorkflow } from "@/lib/backendApi";

type Props = {
  fileUrl: string;
  filename?: string; // ✅ FIX: added missing filename support
};

export default function PdfEditor({ fileUrl, filename }: Props) {
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

      // ⭐ CRITICAL FIX FOR EDITING HISTORY
      enableHistory: true,

      ui: {
        showToolbar: true,
        showSignButton: false,
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // Enable edit mode
      instance.setViewState((viewState: any) =>
        viewState.set(
          "interactionMode",
          NutrientViewer.InteractionMode.CONTENT_EDITOR
        )
      );

      // Enable history
      instance.history.enable();

      // =========================
      // SAVE ORIGINAL PDF ONCE
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
      // TEXT EDIT BUTTON
      // =========================
      const textEditorButton = {
        type: "custom",
        id: "text-editor",
        title: "Edit PDF",
        onPress: () => {
          instance.setViewState((viewState: any) =>
            viewState.set(
              "interactionMode",
              NutrientViewer.InteractionMode.CONTENT_EDITOR
            )
          );
        },
      };

      // =========================
      // PREVIEW BUTTON
      // =========================
      const previewButton = {
        type: "custom",
        id: "preview",
        title: "Preview PDF",
        onPress: async () => {
          const pdfBuffer = await instance.exportPDF();

          const blob = new Blob([pdfBuffer], {
            type: "application/pdf",
          });

          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        },
      };

      // =========================
      // UNDO BUTTON
      // =========================
      const undoButton = {
        type: "custom",
        id: "undo",
        title: "Undo",
        onPress: async () => {
          try {
            if (instance.history?.canUndo?.()) {
              await instance.history.undo();
              refreshToolbar();
            }
          } catch (err) {
            console.error("Undo failed:", err);
          }
        },
      };

      // =========================
      // REDO BUTTON
      // =========================
      const redoButton = {
        type: "custom",
        id: "redo",
        title: "Redo",
        onPress: async () => {
          try {
            if (instance.history?.canRedo?.()) {
              await instance.history.redo();
              refreshToolbar();
            }
          } catch (err) {
            console.error("Redo failed:", err);
          }
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
            console.log("DOWNLOAD CLICKED");

            const pdfBuffer = await instance.exportPDF();

            const blob = new Blob([pdfBuffer], {
              type: "application/pdf",
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // ✅ FIX: use real filename
            const outputName = filename || "document.pdf";
            a.download = outputName;

            a.click();
            URL.revokeObjectURL(url);

            console.log("SENDING TO BACKEND...");

            if (!hasSavedEditedRef.current) {
              hasSavedEditedRef.current = true;

              const fileBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              const res = await savePdfWorkflow({
                filename: outputName, // ✅ FIX
                fileBase64,
                action: "edit",
                workflow_type: "edit",
                document_id: documentId,
              });

              console.log("BACKEND RESPONSE:", res);
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
          textEditorButton,
          previewButton,
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