// src/components/ConversionCard.tsx

import { motion } from 'framer-motion';
import { useEffect, useState } from "react";
import { ArrowRight, FileText } from 'lucide-react';
import type { ConversionOption } from '@/lib/conversionOptions';
import { cn } from '@/lib/utils';

interface ConversionCardProps {
  option: ConversionOption;
  selectedType?: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function ConversionCard({
  option,
  isSelected,
  onClick,
  index,
  selectedType,
}: ConversionCardProps) {

  const Icon = option.icon || FileText;

  const [quickHighlight, setQuickHighlight] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent =
        event as CustomEvent<string>;

      if (customEvent.detail === option.id) {
        setQuickHighlight(true);

        setTimeout(() => {
          setQuickHighlight(false);
        }, 500);
      }
    };

    window.addEventListener(
      "highlight-conversion-card",
      handler
    );

    return () =>
      window.removeEventListener(
        "highlight-conversion-card",
        handler
      );
  }, [option.id]);

  const getOutputLabel = (
    output: string | { label: string; angle?: number }
  ) => {
    if (typeof output === "string") return output;
    return output.label;
  };

  const selected = isSelected || selectedType === option.id;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation();

        // Remove focus after the click to prevent persistent focus outlines
        (e.currentTarget as HTMLButtonElement).blur();

        onClick();
      }}
      className={cn(
        "conversion-card relative w-full transition-all duration-300 group flex flex-col items-center text-center md:h-full md:flex-row md:p-3 md:rounded-2xl md:text-left md:border-2",

        quickHighlight &&
        "ring-4 ring-blue-400 ring-offset-2 shadow-[0_0_25px_rgba(59,130,246,0.45)]",

        selected
          ? "md:border-primary md:bg-primary/5 md:shadow-elevated"
          : "md:border-border md:bg-card md:hover:border-primary/30 md:hover:shadow-soft",

        option.available === false &&
        "opacity-50 cursor-not-allowed"
      )}
      disabled={option.available === false}
    >
      <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-0 md:flex-row md:items-start md:text-left md:gap-4">

        {/* Icon */}
        <div
          className={cn(
            // MOBILE
            "p-7 rounded-3xl transition-all duration-300 shrink-0",

            // DESKTOP - fixed-size container prevents the icon from overflowing
            "md:w-14 md:h-14 md:p-0 md:rounded-xl md:flex md:items-center md:justify-center md:shrink-0 md:flex-none",

            selected
              ? "bg-gradient-primary text-primary-foreground"
              : "bg-muted text-blue-700 group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <Icon className="w-7 h-7 shrink-0" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full overflow-hidden flex flex-col items-center md:items-start">

          {/* Title */}
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 md:mt-0 mb-1">
            <h3 className="w-full font-display font-semibold text-foreground text-sm md:text-base text-center md:text-left break-words">
              {option.label}
            </h3>
          </div>

          {/* Desktop only */}
          {option.description && (
            <p className="hidden md:block w-full text-sm text-muted-foreground break-words line-clamp-2 min-h-[40px]">
              {option.description}
            </p>
          )}

          {/* Desktop only */}
          <div className="hidden md:flex items-center gap-2 mt-auto pt-3">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {option.inputFormats.join(", ")}
            </span>

            <ArrowRight className="w-3 h-3 text-muted-foreground" />

            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
              {option.outputOptions?.length
                ? getOutputLabel(option.outputOptions[0])
                : option.outputFormat}
            </span>
          </div>

        </div>
      </div>
    </motion.button>
  );
}