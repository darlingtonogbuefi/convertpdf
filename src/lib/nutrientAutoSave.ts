// src/lib/nutrientAutoSave.ts


import { getBaseUrl } from "@/config/backend";

let saveTimer: any = null;

export function attachAutoSave(instance: any, fileName: string, type: string) {
  const save = async () => {
    const pdfBuffer = await instance.exportPDF();

    const blob = new Blob([pdfBuffer], {
      type: "application/pdf",
    });

    const file = new File([blob], fileName, {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${getBaseUrl()}/api/convert/pdf-auto-save`, {
      method: "POST",
      body: formData,
      headers: {
        "X-Conversion-Type": type,
      },
    });
  };

  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      save().catch(console.error);
    }, 1500); // wait for user to stop editing
  };

  instance.on("annotationsChanged", debouncedSave);
}