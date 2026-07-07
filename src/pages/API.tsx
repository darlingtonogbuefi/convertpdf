// src/pages/API.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function APIPage() {
  const sections = [
    { id: "pdf-api", label: "PDF Manipulation" },
    { id: "pdf-conversion", label: "PDF Conversions" },
    { id: "word-conversion", label: "Word Conversions" },
    { id: "image-conversion", label: "Image Conversions" },
    { id: "nutrient-api", label: "Nutrient PDF API" },
  ];

  const [activeSection, setActiveSection] = useState(sections[0].id);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    // Offset for sticky sidebar on desktop
    const offset = window.innerWidth >= 768 ? 96 : 0;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSection(id);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 150;
      let current = sections[0].id;
      for (const section of sections) {
        const elem = document.getElementById(section.id);
        if (elem && scrollPos >= elem.offsetTop) current = section.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const fetchExample = (code: string) => code;

  return (
    <motion.section
      id="api-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gray-100 min-h-screen"
    >
      {/* Subpage Header */}
      <SubpageHeader />

      <div className="max-w-3xl mx-auto px-6 pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-6 text-center text-gray-900"
        >
          API Documentation
        </motion.h1>
      </div>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-6 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 md:sticky md:top-24 self-start bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 md:mb-0">
          <h2 className="font-semibold text-lg mb-4">API Sections</h2>
          <ul className="space-y-3">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => scrollToSection(id)}
                  className={`w-full text-left transition-colors duration-200 ${
                    activeSection === id
                      ? "text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-blue-500"
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="w-full md:w-3/4 space-y-20">
          {/* PDF Manipulation */}
          <section id="pdf-api" tabIndex={-1}>
            <h2 className="text-3xl font-bold mb-6">PDF Manipulation</h2>
            <p className="text-sm mb-2 text-gray-600">
              Merge, split, rotate, compress, watermark, overlay, edit, and sign PDFs.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>Steps to use:</strong> Generate an API token, include it in the Authorization header, choose the endpoint for your operation, provide the required JSON body, send a POST request, and receive the processed PDF URL.
            </p>

            {/* Examples */}
            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Merge PDFs</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/merge", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrls: ["https://example.com/file1.pdf","https://example.com/file2.pdf"],
    outputName: "merged.pdf"
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Split PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/split", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrl: "https://example.com/file.pdf",
    pages: [[1,3],[4,5]]
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Rotate Pages</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/rotate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrl: "https://example.com/file.pdf",
    pages: [1,2],
    angle: 90
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Compress PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/compress", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ pdfUrl: "https://example.com/file.pdf" })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Watermark PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/watermark", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrl: "https://example.com/file.pdf",
    watermarkText: "Confidential",
    position: "center"
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Overlay PDFs</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/overlay", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    basePdfUrl: "https://example.com/base.pdf",
    overlayPdfUrl: "https://example.com/overlay.pdf"
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Edit PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/edit", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrl: "https://example.com/file.pdf",
    metadata: {"Title": "New Title"}
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Sign PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/sign", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    pdfUrl: "https://example.com/file.pdf",
    signatureImageUrl: "https://example.com/signature.png",
    position: {page: 1, x: 100, y: 150}
  })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>
          </section>

          {/* PDF Conversions */}
          <section id="pdf-conversion" tabIndex={-1}>
            <h2 className="text-3xl font-bold mb-6">PDF Conversions</h2>
            <p className="text-gray-700 mb-6">
              Convert PDF to Word, Text, Excel, Images, and more. Each endpoint requires the API token in the Authorization header.
            </p>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">PDF to Word</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/to-word", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ pdfUrl: "https://example.com/file.pdf" })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">PDF to Text</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/pdf/to-text", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ pdfUrl: "https://example.com/file.pdf" })
})
.then(res => res.json())
.then(data => console.log(data.text));`)}
              </pre>
            </div>
          </section>

          {/* Word Conversions */}
          <section id="word-conversion" tabIndex={-1}>
            <h2 className="text-3xl font-bold mb-6">Word Conversions</h2>
            <p className="text-gray-700 mb-6">
              Convert Word files to PDF, Text, and other formats using a simple POST request with your API token.
            </p>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Word to PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/word/to-pdf", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ wordUrl: "https://example.com/file.docx" })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>
          </section>

          {/* Image Conversions */}
          <section id="image-conversion" tabIndex={-1}>
            <h2 className="text-3xl font-bold mb-6">Image Conversions</h2>
            <p className="text-gray-700 mb-6">
              Convert images to PDF and other formats with ease using our API endpoints.
            </p>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Image to PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/image/to-pdf", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ imageUrl: "https://example.com/image.png" })
})
.then(res => res.json())
.then(data => console.log(data.outputUrl));`)}
              </pre>
            </div>
          </section>

          {/* Nutrient PDF API */}
          <section id="nutrient-api" tabIndex={-1}>
            <h2 className="text-3xl font-bold mb-6">Nutrient PDF API</h2>
            <p className="text-gray-700 mb-6">
              Automatically parse nutrition PDFs into structured JSON data. Include your API token in the Authorization header for all requests.
            </p>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">Parse Nutrition PDF</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
{fetchExample(`fetch("https://yourdomain.com/api/nutrients/parse", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ pdfUrl: "https://example.com/nutrition.pdf" })
})
.then(res => res.json())
.then(data => console.log(data.nutrients));`)}
              </pre>
            </div>
          </section>
        </main>
      </div>
    </motion.section>
  );
}