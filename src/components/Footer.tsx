// src/components/footer.tsx

import { X, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";

interface FooterProps {
  user?: any;
}

export default function Footer({ user }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">

        {/* Bottom section */}
        <div className="flex flex-col items-center pt-8 border-t border-gray-200 text-center">

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <Link
              to="/terms"
              className="text-gray-600 underline underline-offset-4 hover:text-blue-600 transition-colors"
            >
              Terms of Use
            </Link>

            <Link
              to="/privacy"
              className="text-gray-600 underline underline-offset-4 hover:text-blue-600 transition-colors"
            >
              Privacy & Cookies Policy
            </Link>
          </div>

          <div className="text-gray-600 mb-4">
            <span>© {currentYear}</span>
            <span className="ml-2">www.convertpdf.cribr.co.uk</span>
            <span className="ml-2">All rights reserved.</span>

            <div className="text-xs text-gray-400 mt-1 max-w-xl">
              <p>
                ConvertPDF (www.convertpdf.cribr.co.uk) is a personal project for experimentation and proof-of-concept
                purposes. It is not affiliated with, endorsed by, or sponsored
                by any person, company or organization.
              </p>

              <p>
                All product names, logos, and brands are the property of their
                respective owners.
              </p>
            </div>
          </div>

          <div className="flex space-x-6">

            <a
              href="https://x.com/D4RL1NGTN"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="X (formerly Twitter)"
            >
              <X className="h-6 w-6" />
            </a>

            <a
              href="https://www.linkedin.com/in/darlington-ogbuefi-310251259/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-6 w-6" />
            </a>

            <a
              href="https://github.com/darlingtonogbuefi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-6 w-6" />
            </a>

          </div>
        </div>

      </div>
    </footer>
  );
}