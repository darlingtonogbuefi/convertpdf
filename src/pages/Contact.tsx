// src/pages/Contact.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function ContactPage() {
  const sections = [
    { id: "contact-details", label: "Contact Details" },
    { id: "contact-form", label: "Send Us a Message" },
  ];

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    // Offset for sticky sidebar on desktop
    const offset = window.innerWidth >= 768 ? 96 : 0; // 24*4 = 96px
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

  return (
    <motion.section
      id="contact-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gray-100 min-h-screen"
    >
      {/* Subpage Header */}
      <SubpageHeader />

      {/* Page Title */}
      <div className="max-w-3xl mx-auto px-6 pt-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-6 text-gray-900"
        >
          Contact Us
        </motion.h1>
      </div>

      {/* Sidebar + Main Content */}
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-6 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 md:sticky md:top-24 self-start bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 md:mb-0">
          <h2 className="font-semibold text-lg mb-4">Sections</h2>
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

        {/* Main Content */}
        <main className="w-full md:w-3/4 space-y-20">
          {/* Intro Text */}
          <div className="text-gray-700 mb-6">
            Have questions or want to get in touch? We're here to help! Fill out the form below or use the contact details.
          </div>

          {/* Contact Details Section */}
          <section
            id="contact-details"
            tabIndex={-1}
            className="bg-white p-8 rounded-md shadow-md border border-gray-200"
          >
            <h2 className="text-3xl font-bold mb-6">Contact Details</h2>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:admin@cribr.co.uk"
                  className="text-blue-600 hover:underline"
                >
                  admin@cribr.co.uk
                </a>
              </li>
              <li>
                <strong>Phone:</strong>{" "}
                <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                  +1 (234) 567-890
                </a>
              </li>
              <li>
                <strong>Address:</strong> 123 AI Drive, Innovation City, CA 94000
              </li>
              <li>
                <strong>Support Hours:</strong> Monday - Friday, 9 AM - 6 PM (PST)
              </li>
            </ul>
          </section>

          {/* Contact Form Section */}
          <section
            id="contact-form"
            tabIndex={-1}
            className="bg-white p-8 rounded-md shadow-md border border-gray-200"
          >
            <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="text-green-600 font-semibold text-lg">
                Thank you for contacting us! We’ll get back to you shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
                >
                  Send Message
                </button>
              </form>
            )}
          </section>
        </main>
      </div>
    </motion.section>
  );
}