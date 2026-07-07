// src/pages/AboutPage.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function AboutPage() {
  const sections = [
    { id: "about-app", label: "About CönvertPĐF" },
    { id: "team", label: "Team" },
    { id: "tech", label: "Tech Stack" },
  ];

  const [activeSection, setActiveSection] = useState(sections[0].id);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

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
        if (elem && scrollPos >= elem.offsetTop) {
          current = section.id;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <motion.section
      id="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gray-100 min-h-screen overflow-x-hidden"
    >
      <SubpageHeader />

      {/* Centered Title */}
      <div className="max-w-3xl mx-auto px-6 pt-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-gray-900"
        >
          About CönvertPĐF
        </motion.h1>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-6 gap-8 overflow-x-hidden">

        {/* Sidebar */}
        <aside className="w-full md:w-1/4 md:sticky md:top-24 self-start bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 md:mb-0 overflow-x-hidden min-w-0">
          <h2 className="font-semibold text-lg mb-4">Sections</h2>

          <ul className="space-y-3">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => scrollToSection(id)}
                  className={`w-full text-left break-words whitespace-normal transition-colors duration-200 ${activeSection === id
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

        {/* Main Content */}
        <main className="w-full md:w-3/4 space-y-12 min-w-0">

          {/* About App */}
          <section
            id="about-app"
            tabIndex={-1}
            className="bg-white p-8 rounded-md shadow-md border border-gray-200 space-y-6"
          >
            <h2 className="text-3xl font-bold mb-4">App Information</h2>

            <p className="text-lg text-gray-800/90">
              CönvertPĐF is a web application that allows users to{" "}
              <strong>
                convert, edit, merge, split, sign, rotate, watermark, and compress PDFs
              </strong>{" "}
              with ease. No signup is required—simply upload your files and get started.
            </p>

            <p className="text-lg text-gray-800/90">
              Users can handle multiple files at once, choose output formats, and download results instantly.
            </p>
          </section>

          {/* Team */}
          <section
            id="team"
            tabIndex={-1}
            className="bg-white p-8 rounded-md shadow-md border border-gray-200 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Team</h2>

            <p className="text-lg font-medium text-gray-800/90">
              Darlington Ogbuefi — Developer
            </p>

            <p className="text-lg text-gray-800/90">
              ConvertPDF (convertpdf.cribr.co.uk) is a personal project built and maintained by Darlington Ogbuefi for experimentation, and proof-of-concept (POC) purposes.
            </p>

            <p className="text-lg text-gray-800/90">
              This project is provided for demonstration and testing purposes only. It is not affiliated with, endorsed by, sponsored by, or associated with any person, company or organization unless explicitly stated otherwise.
            </p>
            
             <p className="text-lg text-gray-800/90">
              All trademarks, logos, and names or brand names referenced on this website are the property of their respective owners. Their use does not imply any affiliation, endorsement, or sponsorship.
              </p>

              <p className="text-lg text-gray-800/90">
                While reasonable efforts are made to ensure the reliability and security of the service, ConvertPDF is offered on an "as is" basis without warranties of any kind.
              </p>

            <p className="text-lg text-gray-800/90 break-words">
              GitHub:{" "}
              <a
                href="https://github.com/darlingtonogbuefi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                github.com/darlingtonogbuefi
              </a>
            </p>
          </section>

          {/* Tech Stack */}
          <section
            id="tech"
            tabIndex={-1}
            className="bg-white p-8 rounded-md shadow-md border border-gray-200 space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Tech Stack</h2>

            <p className="text-lg text-gray-800/90">
              <strong>Frontend:</strong> React + Vite, TypeScript, TailwindCSS,
              Framer Motion, lucide-react icons.
            </p>

            <p className="text-lg text-gray-800/90">
              <strong>Backend:</strong> Python (FastAPI), PDF libraries (PyPDF2,
              pdf2image, python-docx, Pillow), hosted on App Service (Linux) – Custom Container.
            </p>

            <p className="text-lg text-gray-800/90">
              <strong>Infrastruture:</strong> Azure Landing Zone (Hub and Spoke - full-single-region), Azure App Service, Azure External ID (CIAM Tenant),
              Azure APIM, Azure Blob Storage, Azure PostgreSQL, Azure Front Door (CDN), Azure DevOps CI/CD, Azure DNS, Microsoft Defender for Cloud (All relevant modules).
            </p>

            <p className="text-lg text-gray-800/90">
              This stack ensures fast, secure, and scalable PDF processing with a smooth
              user experience.
            </p>
          </section>
        </main>
      </div>
    </motion.section>
  );
}