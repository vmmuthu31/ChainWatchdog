"use client";

import Image from "next/image";

interface TokenLogoProps {
  src: string;
  alt: string;
  size?: number;
}

const TokenLogo = ({ src, alt, size = 32 }: TokenLogoProps) => {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-black/30 border border-[#00ff00]/30"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/fallback-token.png";
          }}
        />
      ) : (
        <div className="text-center text-[#00ff00] font-bold flex items-center justify-center w-full h-full">
          {alt?.substring(0, 1) || "?"}
        </div>
      )}
    </div>
  );
};

export default TokenLogo;
