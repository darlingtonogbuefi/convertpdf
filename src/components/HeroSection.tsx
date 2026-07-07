// src/components/HeroSection.tsx

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  FileText,
  FileImage,
  FileSpreadsheet,
  Scissors,
  Minimize2,
  PenTool,
  Stamp,
  Layers,
  RotateCw,
  Droplets,
  Presentation,
  ArrowRight,
  Menu,
  Edit3,
} from 'lucide-react';

import { FileDropzone } from './FileDropzone';
import { Button } from '@/components/ui/button';
import { useMsal } from "@azure/msal-react";
import { loginRequest, signUpRequest } from "../auth/msalConfig";

import type {
  ConversionType,
  ConvertedFile,
  ConversionStatus,
} from '@/types/converter';

import { conversionOptions } from '@/lib/conversionOptions';
import { conversionHelpText } from "@/lib/conversionHelpText";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ConversionProgress } from './ConversionProgress';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface HeroSectionProps {
  acceptedFormats?: string[];
  disabled?: boolean;
  initialFiles?: File[];
  selectedType?: ConversionType;

  onConvert?: (
    files: File[],
    setProgress?: (p: number) => void,
    setStatus?: (s: ConversionStatus) => void,
    outputOption?: string | number
  ) => Promise<ConvertedFile[]>;

  onReset?: () => void;
  onOpenPopup?: () => void;

  inHistory?: boolean;
}

const getConversionIcon = (type?: ConversionType) => {
  const iconProps = { className: 'w-7 h-7' };

  if (!type) {
    return (
      <div className="w-7 h-7 flex items-center justify-center">
        <img
          src="/android-chrome-512x512.png"
          alt="ConvertPDF Logo"
          className="w-full h-full object-contain scale-150"
        />
      </div>
    );
  }

  switch (type) {
    case 'pdf-to-image':
      return <FileImage {...iconProps} />;
    case 'pdf-to-word':
      return <FileText {...iconProps} />;
    case 'pdf-to-excel':
      return <FileSpreadsheet {...iconProps} />;
    case 'image-to-pdf':
    case 'image-to-word':
    case 'image-to-excel':
      return <FileImage {...iconProps} />;
    case 'word-to-excel':
      return <FileSpreadsheet {...iconProps} />;
    case 'pdf-split':
      return <Scissors {...iconProps} />;
    case 'pdf-compress':
      return <Minimize2 {...iconProps} />;
    case 'pdf-sign':
      return <PenTool {...iconProps} />;
    case 'pdf-stamp':
      return <Stamp {...iconProps} />;
    case 'pdf-edit':
      return <Edit3 {...iconProps} />;
    case 'pdf-merge':
      return <Layers {...iconProps} />;
    case 'pdf-rotate':
      return <RotateCw {...iconProps} />;
    case 'pdf-watermark':
      return <Droplets {...iconProps} />;
    case 'pdf-to-powerpoint':
      return <Presentation {...iconProps} />;
    default:
      return (
        <div className="w-7 h-7 flex items-center justify-center">
          <img
            src="/android-chrome-512x512.png"
            alt="ConvertPDF Logo"
            className="w-full h-full object-contain scale-150"
          />
        </div>
      );
  }
};

export function HeroSection({
  acceptedFormats,
  disabled = false,
  selectedType,
  onConvert,
  onReset,
  onOpenPopup,
  inHistory,
  initialFiles,
}: HeroSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (initialFiles?.length) {
      setSelectedFiles(initialFiles);
    }
  }, [initialFiles]);

  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);

  const [pdfImageOption] = useState('JPG');
  const [pdfRotateOption] = useState<number>(90);
  const [forceHighlight, setForceHighlight] = useState(false);

  const [showUploadHint, setShowUploadHint] = useState(false);
  const [showDropzonePrompt, setShowDropzonePrompt] = useState(false);

  const [activeAuth, setActiveAuth] = useState<string | null>(null);

  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const [showHero, setShowHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const authRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const hasFiles = selectedFiles.length > 0;
  const showReset =
    hasFiles || convertedFiles.length > 0;

  // FIXED MENU REF
  const menuRef = useRef<HTMLDivElement>(null);

  // MOBILE DETECTION
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener(
      'resize',
      checkMobile
    );

    return () => {
      window.removeEventListener(
        'resize',
        checkMobile
      );
    };
  }, []);

  // CLICK OUTSIDE HANDLER (FIXED)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // close hamburger menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }

      // close auth dropdown (user icon)
      if (authRef.current && !authRef.current.contains(target)) {
        setAuthMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // LOCK BODY SCROLL
  useEffect(() => {
    if (menuOpen && isMobile) {
      document.body.style.overflow =
        'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, isMobile]);

  // RESET CONVERTED FILES ON NEW SELECTION
  useEffect(() => {
    if (selectedFiles.length > 0) {
      setConvertedFiles([]);
    }
  }, [selectedFiles]);

  // DROPZONE HIGHLIGHT
  useEffect(() => {
    const handleHighlight = () => {
      setForceHighlight(true);

      setTimeout(() => {
        setForceHighlight(false);
      }, 2500);
    };

    window.addEventListener("highlight-dropzone", handleHighlight);

    // ✅ FIX: catch "missed event" after navigation
    const checkSession = () => {
      const shouldHighlight =
        sessionStorage.getItem("showDropzonePrompt") === "1";

      if (!shouldHighlight) return;

      sessionStorage.removeItem("showDropzonePrompt");
      handleHighlight();
    };

    // run immediately on mount (fixes navigation race)
    checkSession();

    return () => {
      window.removeEventListener("highlight-dropzone", handleHighlight);
    };
  }, []);

  // HERO SHOW/HIDE (FIXED MOBILE COLLAPSE BEHAVIOR)
  useEffect(() => {
    if (!isMobile) {
      setShowHero(true);
      return;
    }

    /**
     * CRITICAL FIX:
     * If user is in History section, completely ignore scroll logic
     */
    if (inHistory) {
      setShowHero(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;

      const hasActiveState =
        menuOpen ||
        selectedFiles.length > 0 ||
        convertedFiles.length > 0;

      if (hasActiveState) {
        setShowHero(true);
        return;
      }

      if (scrollY > 1) {
        setShowHero(false);
      } else {
        setShowHero(true);
      }
    };

    // run once immediately
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    isMobile,
    inHistory,
    menuOpen,
    selectedFiles.length,
    convertedFiles.length
  ]);


  const handleFilesSelected = (
    files: File[]
  ) => {
    setSelectedFiles(files);
    setConvertedFiles([]);

    if (!selectedType && files.length > 0) {
      onOpenPopup?.();
    }
  };

  const handleRemoveFile = (
    index: number
  ) => {
    setSelectedFiles(prev =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    setStatus('idle');
    setProgress(0);

    onReset?.();

    toast.success('Conversion reset');
  };

  const handleDownload = (
    file: ConvertedFile
  ) => {
    if (!file) return;

    const anyFile: any = file;

    // BLOB / FILE
    if (
      anyFile.blob instanceof Blob ||
      anyFile.file instanceof Blob
    ) {
      saveAs(
        anyFile.blob ?? anyFile.file,
        file.name || 'converted-file'
      );

      return;
    }

    // URL
    if (anyFile.url) {
      const link =
        document.createElement('a');

      link.href = anyFile.url;
      link.download =
        file.name || 'converted-file';

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      return;
    }

    // BASE64
    if (anyFile.base64) {
      const base64Data =
        anyFile.base64.includes(',')
          ? anyFile.base64.split(',')[1]
          : anyFile.base64;

      const byteCharacters =
        atob(base64Data);

      const byteNumbers = new Array(
        byteCharacters.length
      );

      for (
        let i = 0;
        i < byteCharacters.length;
        i++
      ) {
        byteNumbers[i] =
          byteCharacters.charCodeAt(i);
      }

      const byteArray =
        new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray]);

      saveAs(
        blob,
        file.name || 'converted-file'
      );

      return;
    }

    console.error(
      'No downloadable data found:',
      file
    );
  };

  // FULLY FIXED DOWNLOAD ALL
  const handleDownloadAll =
    async () => {
      if (!convertedFiles.length)
        return;

      try {
        const zip = new JSZip();

        for (
          let i = 0;
          i < convertedFiles.length;
          i++
        ) {
          const file: any =
            convertedFiles[i];

          // HANDLE NESTED ARRAYS
          if (Array.isArray(file)) {
            for (
              let j = 0;
              j < file.length;
              j++
            ) {
              const nestedFile =
                file[j];

              if (!nestedFile) continue;

              const originalName =
                nestedFile.name ||
                `file-${i + 1}-${j + 1}.pdf`;

              const dotIndex =
                originalName.lastIndexOf(
                  '.'
                );

              const baseName =
                dotIndex !== -1
                  ? originalName.slice(
                    0,
                    dotIndex
                  )
                  : originalName;

              const ext =
                dotIndex !== -1
                  ? originalName.slice(
                    dotIndex
                  )
                  : '.pdf';

              const uniqueName = `${baseName}_page_${j + 1}${ext}`;

              if (
                nestedFile.blob instanceof
                Blob ||
                nestedFile.file instanceof
                Blob
              ) {
                zip.file(
                  uniqueName,
                  nestedFile.blob ??
                  nestedFile.file
                );
              } else if (
                nestedFile.url
              ) {
                try {
                  const res =
                    await fetch(
                      nestedFile.url
                    );

                  const data =
                    await res.blob();

                  zip.file(
                    uniqueName,
                    data
                  );
                } catch (err) {
                  console.error(
                    `Failed fetching ${uniqueName}:`,
                    err
                  );
                }
              } else if (
                nestedFile.base64
              ) {
                const base64Data =
                  nestedFile.base64.includes(
                    ','
                  )
                    ? nestedFile.base64.split(
                      ','
                    )[1]
                    : nestedFile.base64;

                zip.file(
                  uniqueName,
                  base64Data,
                  {
                    base64: true,
                  }
                );
              }
            }
          } else {
            if (!file) continue;

            const originalName =
              file.name ||
              `file-${i + 1}.pdf`;

            const dotIndex =
              originalName.lastIndexOf(
                '.'
              );

            const baseName =
              dotIndex !== -1
                ? originalName.slice(
                  0,
                  dotIndex
                )
                : originalName;

            const ext =
              dotIndex !== -1
                ? originalName.slice(
                  dotIndex
                )
                : '.pdf';

            const uniqueName =
              convertedFiles.length > 1
                ? `${baseName}_page_${i + 1}${ext}`
                : originalName;

            if (
              file.blob instanceof Blob ||
              file.file instanceof Blob
            ) {
              zip.file(
                uniqueName,
                file.blob ?? file.file
              );
            } else if (file.url) {
              try {
                const res =
                  await fetch(file.url);

                const data =
                  await res.blob();

                zip.file(
                  uniqueName,
                  data
                );
              } catch (err) {
                console.error(
                  `Failed fetching ${uniqueName}:`,
                  err
                );
              }
            } else if (file.base64) {
              const base64Data =
                file.base64.includes(',')
                  ? file.base64.split(
                    ','
                  )[1]
                  : file.base64;

              zip.file(
                uniqueName,
                base64Data,
                {
                  base64: true,
                }
              );
            }
          }
        }

        const zipBlob =
          await zip.generateAsync({
            type: 'blob',
          });

        saveAs(
          zipBlob,
          'split-files.zip'
        );

        toast.success(
          'ZIP download started'
        );
      } catch (error) {
        console.error(
          'ZIP creation failed:',
          error
        );

        toast.error(
          'Failed to create ZIP file'
        );
      }
    };

  const handleConvert = async () => {
    const currentType = selectedType;

    if (!hasFiles) return;

    if (!currentType) {
      toast.error(
        'Please select a conversion type first'
      );

      return;
    }

    const option =
      conversionOptions.find(
        o => o.id === currentType
      );

    if (option?.usePopup) {
      const file = selectedFiles[0];

      if (currentType === 'pdf-sign') {
        navigate('/pdfsign', {
          state: {
            file,
            filename: file.name,
          },
        });
      } else if (
        currentType ===
        'pdf-watermark'
      ) {
        navigate('/pdfwatermark', {
          state: { file },
        });
      } else if (
        currentType === 'pdf-stamp'
      ) {
        navigate('/pdfstamper', {
          state: {
            file,
            filename: file.name,
          },
        });
      } else if (
        currentType === 'pdf-edit'
      ) {
        navigate('/pdf-editor', {
          state: {
            file,
            filename: file.name,
          },
        });
      }

      return;
    }

    let newStatus: ConversionStatus =
      'converting';

    if (currentType === 'pdf-split') {
      newStatus = 'splitting';
    } else if (
      currentType ===
      'pdf-compress'
    ) {
      newStatus = 'compressing';
    } else if (
      currentType === 'pdf-rotate'
    ) {
      newStatus = 'rotating';
    } else if (
      currentType === 'pdf-merge'
    ) {
      newStatus = 'merging';
    }

    setStatus(newStatus);
    setProgress(0);

    try {
      let result: ConvertedFile[] = [];

      if (onConvert) {
        const outputOption =
          currentType ===
            'pdf-to-image'
            ? pdfImageOption
            : currentType ===
              'pdf-rotate'
              ? pdfRotateOption
              : undefined;

        result = await onConvert(
          selectedFiles,
          setProgress,
          setStatus,
          outputOption
        );
      }

      setConvertedFiles(result);
      setSelectedFiles([]);
      setStatus('complete');

      onReset?.();
    } catch (error: any) {
      setStatus('error');

      toast.error(
        error?.message ||
        'Conversion failed'
      );
    }
  };

  const getButtonText = () => {
    if (!selectedType)
      return 'Convert';

    switch (selectedType) {
      case 'pdf-watermark':
        return 'Upload to Watermark';

      case 'pdf-sign':
        return 'Upload to Sign';

      case 'pdf-stamp':
        return 'Upload to Stamp';

      case 'pdf-edit':
        return 'Upload to Edit';

      case 'pdf-compress':
        return 'Compress PDF';

      case 'pdf-merge':
        return 'Merge PDFs';

      case 'pdf-rotate':
        return 'Rotate PDF';

      case 'pdf-split':
        return 'Split PDF';

      default:
        return `Convert ${selectedType.replace(
          /-/g,
          ' '
        )}`;
    }
  };

  useEffect(() => {
    if (!selectedType) return;

    setShowUploadHint(true);

    const timer = setTimeout(() => {
      setShowUploadHint(false);
    }, 3500);


    return () => clearTimeout(timer);
  }, [selectedType]);

  useEffect(() => {
    if (!showDropzonePrompt) return;

    const timer = setTimeout(() => {
      setShowDropzonePrompt(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [showDropzonePrompt]);



  useEffect(() => {
    const shouldShow =
      sessionStorage.getItem("showDropzonePrompt");

    if (!shouldShow) return;

    setShowDropzonePrompt(true);

    sessionStorage.removeItem(
      "showDropzonePrompt"
    );

    const timer = setTimeout(() => {
      setShowDropzonePrompt(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);


  return (
    <div>
      <motion.section
        id="hero-section"
        animate={{
          opacity: showHero ? 1 : 0,
          y: showHero ? 0 : -40,
          height: showHero
            ? 'auto'
            : 0,
          paddingTop: showHero
            ? '2rem'
            : 0,
          paddingBottom: showHero
            ? '1rem'
            : 0,
          pointerEvents: showHero
            ? 'auto'
            : 'none',
        }}
        transition={{
          duration: 0.25,
          ease: 'easeOut',
        }}
        className="
          relative z-40 overflow-hidden
          bg-gradient-to-r from-blue-600 to-purple-600
          text-white
        "

      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

        {/* DESKTOP AUTH */}
        <div className="absolute right-4 top-4 z-50 hidden md:block">
          <div ref={authRef} className="relative">

            <button
              onClick={() => setAuthMenuOpen((p) => !p)}
              className="
        p-2 rounded-full
        bg-white/20 hover:bg-white/30
        backdrop-blur-md
        transition-colors duration-200
      "
            >
              <User className="w-6 h-6 text-white" />
            </button>

            {authMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}
                className="
          absolute top-full right-0 mt-2 w-40
          rounded-[6px]
          bg-white/5
          backdrop-blur-md
          shadow-lg
          flex flex-col
          overflow-hidden
          p-1 gap-0.5
        "
              >
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => instance.loginRedirect(loginRequest)}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Sign In
                    </button>

                    <button
                      onClick={() => instance.loginRedirect(signUpRequest)}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => {
                        onOpenPopup?.();
                        setAuthMenuOpen(false);
                        setShowDropzonePrompt(true);
                      }}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Try for Free
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Dashboard
                    </button>

                    {/* ✅ ADD THIS HERE */}
                    <button
                      onClick={() => {
                        onOpenPopup?.();
                        setAuthMenuOpen(false);
                        setShowDropzonePrompt(true);
                      }}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Try for Free
                    </button>

                    <button
                      onClick={() => instance.logoutRedirect()}
                      className="px-3 py-1 text-sm font-semibold text-white rounded-[4px] hover:bg-white/20 text-left w-full"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* MENU WRAPPER */}
        {/* MOBILE MENU (UNCHANGED) */}
        <div ref={menuRef} className="absolute inset-0 z-50 pointer-events-none">
          {menuOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="
              pointer-events-auto
              fixed top-0 left-0
              w-full h-[310px]
              overflow-y-auto
              z-[99999]
              bg-gradient-to-r from-blue-600 to-purple-600
              flex flex-col items-center
              pt-5 px-2
              md:hidden
            "
            >
              <div className="w-full flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    navigate('/api');
                    setMenuOpen(false);
                  }}
                  className="
                    px-4
                    text-sm font-semibold
                    text-white
                    text-left
                    hover:bg-white/20
                    transition-colors duration-200
                    rounded-md
                    w-full
                  "
                >
                  API
                </button>

                <button
                  onClick={() => {
                    navigate('/about');
                    setMenuOpen(false);
                  }}
                  className="
                    px-4
                    text-sm font-semibold
                    text-white
                    text-left
                    hover:bg-white/20
                    transition-colors duration-200
                    rounded-md
                    w-full
                  "
                >
                  About
                </button>

                <button
                  onClick={() => {
                    navigate('/contact');
                    setMenuOpen(false);
                  }}
                  className="
                    px-4
                    text-sm font-semibold
                    text-white
                    text-left
                    hover:bg-white/20
                    transition-colors duration-200
                    rounded-md
                    w-full
                  "
                >
                  Contact Us
                </button>


                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);

                        if (location.pathname === "/dashboard") {
                          navigate("/");
                        } else {
                          navigate("/dashboard");
                        }
                      }}
                      className="
        w-[98%]
        py-2
        text-sm font-semibold
        text-white
        bg-white/20
        hover:bg-white/30
        rounded-md
      "
                    >
                      {location.pathname === "/dashboard" ? "Home" : "Dashboard"}
                    </button>

                    {/* ✅ NEW: Try for Free (logged-in mobile only) */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveAuth("try");
                        onOpenPopup?.();
                        setShowDropzonePrompt(true);

                        setTimeout(() => {
                          setActiveAuth(null);
                        }, 300);
                      }}
                      className="
        w-[98%]
        py-2
        text-sm font-semibold
        text-white
        bg-white/20
        hover:bg-white/30
        rounded-md
        transition-colors duration-200
      "
                    >
                      Try for Free
                    </button>
                  </>
                )}

                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        instance.loginRedirect(loginRequest);
                      }}
                      className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      Sign In
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        instance.loginRedirect(signUpRequest);
                      }}
                      className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveAuth("try");

                        // same behavior as desktop hero button
                        onOpenPopup?.();
                        setShowDropzonePrompt(true);

                        // optional: reset highlight like other buttons
                        setTimeout(() => {
                          setActiveAuth(null);
                        }, 300);
                      }}
                      className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md transition-colors duration-200"
                    >
                      Try for Free
                    </button>

                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      instance.logoutRedirect();
                    }}
                    className="w-[98%] py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 rounded-md"
                  >
                    Sign Out
                  </button>
                )}



                <div className="w-full flex justify-center">
                  <button
                    onClick={() =>
                      setMenuOpen(false)
                    }
                    className="
                      w-[98%]
                      py-2
                      text-sm font-semibold
                      text-white
                      bg-white/20
                      hover:bg-white/30
                      transition-colors duration-200
                      rounded-md
                    "
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* HAMBURGER */}
          <div className="absolute top-4 left-4">
            <button
              onClick={() =>
                setMenuOpen(prev => !prev)
              }
              className="
                pointer-events-auto
                p-2 rounded-md
                bg-white/20
                hover:bg-white/30
                focus:outline-none
              "
            >
              <Menu className="w-6 h-6 text-white" />
            </button>

            {/* DESKTOP MENU */}
            {menuOpen && !isMobile && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                style={{
                  fontFamily:
                    "'Space Grotesk', system-ui, sans-serif",
                }}
                className="
  pointer-events-auto
  absolute top-full left-0 mt-2 w-40
  rounded-[6px]
  bg-white/5
  backdrop-blur-md
  shadow-xl
  overflow-hidden
  flex flex-col
  p-1 gap-0.5
"
              >
                <button
                  className="
  px-3 py-1
  text-sm font-semibold
  rounded-[4px]
  text-white
  text-right w-full
  hover:bg-white/20
"
                  onClick={() => {
                    navigate('/api');
                    setMenuOpen(false);
                  }}
                >
                  API
                </button>

                <button
                  className="
  px-3 py-1
  text-sm font-semibold
  rounded-[4px]
  text-white
  text-right w-full
  hover:bg-white/20
"
                  onClick={() => {
                    navigate('/about');
                    setMenuOpen(false);
                  }}
                >
                  About
                </button>

                <button
                  className="
  px-3 py-1
  text-sm font-semibold
  rounded-[4px]
  text-white
  text-right w-full
  hover:bg-white/20
"
                  onClick={() => {
                    navigate('/contact');
                    setMenuOpen(false);
                  }}
                >
                  Contact Us
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div
          className={`relative max-w-7xl mx-auto px-4 text-center ${menuOpen && isMobile ? "pointer-events-none" : ""
            }`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              key={selectedType}
              className="inline-flex bg-white/20 rounded-xl p-3 mb-3"
            >
              {getConversionIcon(
                selectedType
              )}
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              CönvertPĐF
            </h1>

            <p className="text-blue-100 mb-4 max-w-2xl mx-auto">
              Upload file to edit or convert for free.
            </p>

            <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-4 max-w-6xl mx-auto">
              <div className="relative">

                {showDropzonePrompt && selectedType && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white text-sm px-4 py-2 rounded-md shadow-lg text-center max-w-[90%]">
                      {conversionHelpText[selectedType]}
                    </div>
                  </div>
                )}

                <FileDropzone
                  acceptedFormats={acceptedFormats}
                  selectedFiles={selectedFiles}
                  onFilesSelected={handleFilesSelected}
                  onRemoveFile={handleRemoveFile}
                  maxFiles={10}
                  forceHighlight={forceHighlight}
                />

              </div>

              <ConversionProgress
                status={status}
                progress={progress}
                convertedFiles={
                  convertedFiles
                }
                onDownload={
                  handleDownload
                }
                onDownloadAll={
                  handleDownloadAll
                }
                conversionType={
                  selectedType
                }
              />

              <Button
                onClick={handleConvert}
                disabled={
                  !hasFiles ||
                  status === 'converting'
                }
                className="w-full mt-3"
              >
                {getButtonText()}

                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {showReset && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Reset
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}