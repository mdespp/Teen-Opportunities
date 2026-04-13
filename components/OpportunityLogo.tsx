"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type OpportunityLogoProps = {
  image?: string;
  alt: string;
  className?: string;
  size?: number;
};

export default function OpportunityLogo({
  image,
  alt,
  className = "",
  size = 96,
}: OpportunityLogoProps) {
  const initialSrc = useMemo(() => {
    if (!image || !image.trim()) {
      return "/logos/default.png";
    }

    return `/logos/${image.trim()}.png`;
  }, [image]);

  const [src, setSrc] = useState(initialSrc);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-[#f6efe8] ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => {
          if (src !== "/logos/default.png") {
            setSrc("/logos/default.png");
          }
        }}
      />
    </div>
  );
}