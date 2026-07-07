//   src/pages/Convert.tsx

import { useSearchParams, useNavigate } from "react-router-dom";
import { useConversions } from "@/hooks/useConversions";
import { conversionOptions } from "@/lib/conversionOptions";
import { useMemo, useState } from "react";
import { SubpageHeader } from "@/components/SubpageHeader";
import { getBaseUrl } from "@/config/backend";
import { authFetch } from "@/lib/authFetch";
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Trash2,
  ArrowLeft,
} from "lucide-react";

const conversionLabelMap = new Map(
  conversionOptions.map(opt => [opt.id, opt.label])
);

export default function Convert() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tab = searchParams.get("tab");

  const {
    conversions,
    loading,
    clearHistory,
  } = useConversions();

  // ---------------------------------------------------
  // SEARCH STATE (NEW)
  // ---------------------------------------------------
  const [search, setSearch] = useState("");

  const cardGlow =
    "bg-white rounded-3xl shadow-lg border-2 border-blue-600/40 hover:border-blue-600/40 transition-all duration-300";

  // ---------------------------------------------------
  // Conversion label helper (same logic as Dashboard)
  // ---------------------------------------------------
  const getConversionLabel = (item: any) => {
    const key =
      item.conversion_type ||
      item.tool_id ||
      item.action;

    if (key) {
      const label = conversionLabelMap.get(key);
      if (label) return label;
    }

    if (item.source_format && item.target_format) {
      return `${item.source_format.toUpperCase()} → ${item.target_format.toUpperCase()}`;
    }

    return "PDF Action";
  };

  // ---------------------------------------------------
  // FILTERED CONVERSIONS
  // ---------------------------------------------------
  const filteredConversions = useMemo(() => {
    return conversions
      .filter((item: any) =>
        item.conversion_type !== "pdf-upload"
      )
      .filter((item: any) =>
        (item.output_filename || item.original_filename)
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [conversions, search]);

  // ---------------------------------------------------
  // GROUP BY DATE
  // ---------------------------------------------------
  const groupedConversions = useMemo(() => {
    return filteredConversions.reduce((acc: any, item: any) => {
      const date = new Date(item.created_date).toDateString();

      if (!acc[date]) acc[date] = [];
      acc[date].push(item);

      return acc;
    }, {});
  }, [filteredConversions]);

  // ---------------------------------------------------
  // DOWNLOAD CONVERTED FILE
  // ---------------------------------------------------
  const handleDownload = async (item: any) => {
    const blobPath = item.converted_blob_path;

    if (!blobPath) {
      console.warn("Missing converted_blob_path", item);
      return;
    }

    try {
      const res = await authFetch(
        `${getBaseUrl()}/api/files/download?container=converted&blob=${encodeURIComponent(
          item.converted_blob_path
        )}`
      );

      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const blob = await res.blob();

      let filename = "download";

      const disposition = res.headers.get("Content-Disposition");

      if (disposition) {
        const regex = /filename="?([^"]+)"?/;
        const match = regex.exec(disposition);

        if (match?.[1]) {
          filename = match[1];
        }
      }

      /* Strip UUID prefix */
      filename = filename.replace(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
        ""
      );

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file");
    }
  };

  // ---------------------------------------------------
  // REUSE CONVERSION
  // ---------------------------------------------------
  const handleReuse = async (item: any) => {
    try {
      const res = await authFetch(
        `${getBaseUrl()}/api/files/download?container=converted&blob=${encodeURIComponent(
          item.converted_blob_path
        )}`
      );

      if (!res.ok) throw new Error("Failed to load file");

      const blob = await res.blob();

      const file = new File(
        [blob],
        item.original_filename || "file",
        { type: blob.type }
      );

      navigate("/", {
        state: {
          reusedFile: file,
        }
      });

    } catch (err) {
      console.error(err);
      alert("Failed to reuse file");
    }
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm("Clear all conversion history? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await clearHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to clear history");
    }
  };

  return (
    <div>
      <SubpageHeader />

      <div className="max-w-5xl mx-auto p-12">
        <h1 className="text-4xl font-bold mb-6">
          Conversion History
        </h1>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:underline"
          >
            ← Dashboard
          </button>

          <button
            onClick={handleClearHistory}
            className="text-red-600 hover:underline"
          >
            Clear History
          </button>
        </div>

        {tab === "history" && (
          <p className="text-gray-500 mb-4">
            Showing all conversions
          </p>
        )}

        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 p-2 border-2 rounded-full
            focus:outline-none
            focus:border-blue-700
            focus:text-blue-700"
        />

        {loading ? (
          <p>Loading...</p>
        ) : conversions.length === 0 ? (
          <p className="text-gray-500">No conversions found</p>
        ) : (
          <div className="space-y-6">

            {Object.entries(groupedConversions).map(
              ([date, items]: any) => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">
                    {date}
                  </h2>

                  <div className="space-y-3">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className={cardGlow + " p-4"}
                      >
                        <div className="flex items-center justify-between">

                          {/* LEFT */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 shrink-0">
                              <CheckCircle2 size={18} className="text-green-600" />
                            </div>

                            <div className="min-w-0">
                              <div className="font-medium break-all">
                                {item.output_filename ?? item.original_filename}
                              </div>

                              <div className="text-sm text-gray-500 truncate max-w-[320px]">
                                {getConversionLabel(item)}
                              </div>

                              <div className="text-xs text-gray-400">
                                {new Date(item.created_date).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* RIGHT */}
                          <div className="flex items-center gap-3">

                            <button
                              onClick={() => handleReuse(item)}
                              className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                            >
                              Convert
                              <RotateCcw size={14} />
                            </button>

                            <button
                              onClick={() => handleDownload(item)}
                              title="Download"
                              className="
                                h-10 w-10 flex items-center justify-center
                                rounded-xl border border-gray-200
                                bg-gray-50 hover:bg-gray-100 transition
                              "
                            >
                              <Download size={18} />
                            </button>

                          </div>

                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}