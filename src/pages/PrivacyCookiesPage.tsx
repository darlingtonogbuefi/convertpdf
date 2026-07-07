// src/pages/PrivacyCookiesPage.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function PrivacyCookiesPage() {
  const sections = [
    { id: "who-we-are", label: "Who We Are" },
    { id: "information", label: "Information We Collect" },
    { id: "use", label: "How We Use Your Data" },
    { id: "legal", label: "Legal Basis (UK GDPR)" },
    { id: "sharing", label: "Data Sharing and Processors" },
    { id: "retention", label: "Data Retention" },
    { id: "security", label: "Data Security" },
    { id: "rights", label: "Your Rights" },
    { id: "cookies", label: "Cookies" },
    { id: "location", label: "Data Storage Location" },
    { id: "children", label: "Children’s Privacy" },
    { id: "changes", label: "Changes to This Policy" },
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
      id="privacy-page"
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
          Privacy & Cookies Policy
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

          <section id="who-we-are" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
            <p className="text-gray-800/90 text-lg">
              This Service is an experimental PDF processing application operated for demonstration and testing purposes.
            </p>
          </section>

          <section id="information" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We collect the following types of data:

a) Account Information
Email address
Username
b) Uploaded Content
Files (e.g. PDFs and documents) uploaded for processing
c) Technical Data
IP address (for security and abuse prevention)
Device and usage information (logs, error data, access times)
d) Cookies

We may use cookies and similar technologies as described below.`}
            </p>
          </section>

          <section id="use" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We use your data to:

Provide PDF processing and conversion functionality
Manage user accounts
Maintain security and prevent abuse
Monitor system performance and errors
Improve reliability of the Service

We do not sell your personal data.`}
            </p>
          </section>

         <section id="legal" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
  <h2 className="text-2xl font-semibold mb-4">
    4. Legal Basis for Processing (UK GDPR)
  </h2>

  <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We process your data under the following lawful bases:

Contract: To provide the Service you request
Legitimate interests: Security, abuse prevention, service improvement
Consent: Where required for cookies or optional features`}
  </p>

  <p className="text-gray-800/90 text-lg mt-4">
    <strong>
      Note: User sign-up and sign-in are intentionally disabled through a Conditional Access Policy to minimize user data collection.
    </strong>
  </p>

  <p className="text-gray-800/90 text-lg whitespace-pre-line mt-4">
{`As a result, users cannot create accounts or sign in. Any sign-up or sign-in attempt will display the following message:

"You cannot access this right now"

"Your sign-in was successful but does not meet the criteria to access this resource. For example, you might be signing in from a browser, app, or location that is restricted by your admin."

If you would like to request access to fully evaluate and test the application, please contact the administrator at admin@cribr.co.uk for further information.

MIT License

This project is licensed under the MIT License.

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
          <section id="sharing" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Processors</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We may share data with trusted third-party service providers strictly for service operation, such as:

Cloud hosting providers
File storage and processing infrastructure
Security and monitoring tools

These providers are contractually required to protect your data and use it only for providing services to us.

We do not sell or rent personal data.`}
            </p>
          </section>

          <section id="retention" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`Uploaded files are retained only as long as needed for processing
Account data (email, username) is retained while the service is active
All personal data and files will be permanently deleted by 23 August 2026
You may request deletion at any time before this date`}
            </p>
          </section>

          <section id="security" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We take reasonable technical and organisational measures to protect your data, including:

HTTPS encryption in transit
Access controls and authentication
Limited access to stored files
Secure storage practices

However, no system can be guaranteed 100% secure.`}
            </p>
          </section>

          <section id="rights" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights (UK GDPR)</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`You have the right to:

Access your personal data
Request correction of inaccurate data
Request deletion of your data
Restrict or object to processing
Request data portability

To exercise your rights, contact: admin@cribr.co.uk`}
            </p>
          </section>

          <section id="cookies" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>

            <p className="text-gray-800/90 text-lg whitespace-pre-line">
{`We use cookies for:

Essential cookies
Authentication and login sessions
Core functionality of the Service
Optional cookies (if used)
Analytics (e.g. usage tracking)
Performance monitoring

You can disable cookies in your browser settings, but some features may not function properly.

Where required, we will request consent before using non-essential cookies.`}
            </p>
          </section>

          <section id="location" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">10. Data Storage Location</h2>
            <p className="text-gray-800/90 text-lg">
              Data may be stored on secure servers located in the UK, EU, or other regions with appropriate safeguards.
            </p>
          </section>

          <section id="children" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">11. Children’s Privacy</h2>
            <p className="text-gray-800/90 text-lg">
              This Service is not intended for users under 16 years old. We do not knowingly collect data from children under this age.
            </p>
          </section>

          <section id="changes" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-800/90 text-lg">
              We may update this Privacy & Cookies Policy from time to time. Continued use of the Service means you accept the updated version.
            </p>
          </section>

          <section id="contact" className="bg-white p-8 rounded-md shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
            <p className="text-gray-800/90 text-lg">
              For privacy requests or questions: Email: admin@cribr.co.uk
            </p>
          </section>

        </main>
      </div>
    </motion.section>
  );
}