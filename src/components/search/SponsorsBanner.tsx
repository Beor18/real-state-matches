"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SPONSORS, type SponsorConfig } from "@/config/sponsors";
import { ExternalLink } from "lucide-react";

interface SponsorsBannerProps {
  sponsors?: SponsorConfig[];
}

export function SponsorsBanner({ sponsors = SPONSORS }: SponsorsBannerProps) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="w-full mt-8 pt-6 border-t border-slate-100"
    >
      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3 text-center">
        Patrocinado por
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </motion.div>
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorConfig }) {
  const content = (
    <motion.div
      whileHover={sponsor.url ? { scale: 1.02 } : undefined}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-50/80 border border-slate-100 transition-colors ${
        sponsor.url
          ? "hover:bg-slate-100 hover:border-slate-200 cursor-pointer"
          : ""
      }`}
    >
      <div className="relative h-8 w-8 shrink-0 rounded-md bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
        <Image
          src={sponsor.logoUrl}
          alt={sponsor.name}
          width={24}
          height={24}
          className="object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement("span");
              fallback.textContent = sponsor.name.charAt(0).toUpperCase();
              fallback.className = "text-xs font-bold text-slate-400";
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold text-slate-600 leading-tight truncate flex items-center gap-1">
          {sponsor.name}
          {sponsor.url && (
            <ExternalLink className="h-2.5 w-2.5 text-slate-300 shrink-0" />
          )}
        </p>
        <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[180px]">
          {sponsor.description}
        </p>
      </div>
    </motion.div>
  );

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default SponsorsBanner;
