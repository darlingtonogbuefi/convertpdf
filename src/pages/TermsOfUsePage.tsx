// src/pages/TermsOfUsePage.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function TermsOfUsePage() {
  const sections = [
    { id: "intro", label: "Terms Header" },
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "description", label: "Description of Service" },
    { id: "eligibility", label: "Eligibility" },
    { id: "accounts", label: "User Accounts" },
    { id: "content", label: "User Content" },
    { id: "responsibility", label: "User Responsibility" },
    { id: "prohibited", label: "Prohibited Use" },
    { id: "storage", label: "Data Storage" },
    { id: "availability", label: "Service Availability" },
    { id: "ip", label: "Intellectual Property" },
    { id: "disclaimer", label: "Disclaimer" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "termination", label: "Termination" },
    { id: "law", label: "Governing Law" },
    { id: "contact", label: "Contact" },
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
      id="terms-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gray-100 min-h-screen overflow-x-hidden"
    >
      <SubpageHeader />

      <div className="max-w-3xl mx-auto px-6 pt-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-gray-900"
        >
          Terms of Use
        </motion.h1>
      </div>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-6 gap-8 overflow-x-hidden">

        {/* Sidebar */}
        <aside className="w-full md:w-1/4 md:sticky md:top-24 self-start bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 md:mb-0 overflow-x-hidden min-w-0">
          <h2 className="font-semibold text-lg mb-4">Sections</h2>

          <ul className="space-y-3">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <button
                  onClick={() => scrollToSection(id)}
                  className={`w-full text-left break-words whitespace-normal transition-colors duration-200 ${
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

        {/* Main Content */}
        <main className="w-full md:w-3/4 space-y-12 min-w-0">

          <section id="intro" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`📄 1. Terms of Use

Last updated: [05 July 2026]`}
            </p>
          </section>

          <section id="acceptance" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`1. Acceptance of Terms

By accessing or using this application (“Service”), you agree to be bound by these Terms of Use. If you do not agree, you must not use the Service.

This Service is an experimental proof-of-concept and may be modified, suspended, or discontinued at any time without notice.`}
            </p>
          </section>

          <section id="description" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`2. Description of Service

The Service provides tools for uploading, processing, converting, and editing PDF and other document files.

The Service is provided on an “as is” and “as available” basis.`}
            </p>
          </section>

          <section id="eligibility" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`3. Eligibility

You must be at least 16 years old (or the minimum legal age in your country) to use this Service.`}
            </p>
          </section>

          <section id="accounts" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`4. User Accounts

To access certain features, you may be required to provide an email address and username.

You agree that:

All information provided is accurate
You will not impersonate any person or entity
You are responsible for all activity under your account`}
            </p>
          </section>

          <section id="content" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`5. User Content and Files

You retain full ownership of all files and content you upload.

By uploading content, you grant us a limited, non-exclusive, worldwide license to:

Store, process, and temporarily modify files solely for providing the Service
Use technical copies as required for processing and security

We do not claim ownership of your content.`}
            </p>
          </section>

          <section id="responsibility" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`6. User Responsibility

You are solely responsible for:

Ensuring you have legal rights to upload and process files
Ensuring files do not infringe third-party rights
Ensuring files do not contain illegal or harmful content`}
            </p>
          </section>

          <section id="prohibited" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`7. Prohibited Use

You agree not to use the Service to upload, process, or distribute:

Illegal content or content promoting illegal activity
Malware, viruses, or malicious code
Copyright-infringing material without permission
Personal data of others without a lawful basis
Content that violates applicable laws or third-party rights

We reserve the right to suspend or terminate access for violations.`}
            </p>
          </section>

          <section id="storage" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`8. Data Storage and Retention

We store:

User account data (email, username)
Uploaded files temporarily for processing

Retention rules:

Files are stored only as long as necessary for processing
All user data and uploaded files will be permanently deleted no later than 23 August 2026
Users may request deletion at any time before this date`}
            </p>
          </section>

          <section id="availability" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`9. Service Availability and Changes

We do not guarantee uninterrupted access to the Service.

We may:

Modify or update features
Suspend or discontinue the Service at any time
Delete stored data in connection with shutdown or maintenance`}
            </p>
          </section>

          <section id="ip" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`10. Intellectual Property

All software, branding, and infrastructure related to the Service remain the property of the operator.`}
            </p>
          </section>

          <section id="disclaimer" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`11. Disclaimer

To the maximum extent permitted by law:

The Service is provided “as is” without warranties of any kind
We do not guarantee accuracy, reliability, or suitability of processed files
We are not responsible for data loss, corruption, or processing errors
We are not responsible for content uploaded by users`}
            </p>
          </section>

          <section id="liability" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`12. Limitation of Liability

We are not liable for any indirect, incidental, or consequential damages arising from use of the Service, including loss of data, profits, or business.`}
            </p>
          </section>

          <section id="termination" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`13. Termination

We may suspend or terminate access at any time for:

Abuse or misuse
Security risks
Legal or operational reasons`}
            </p>
          </section>

          <section id="law" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`14. License

This project is licensed under the MIT License.

MIT License

Copyright (c) [2026]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </p>
          </section>

          <section id="contact" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`15. Contact

For questions or requests:
Email: admin@cribr.co.uk`}
            </p>
          </section>

        </main>
      </div>
    </motion.section>
  );
}