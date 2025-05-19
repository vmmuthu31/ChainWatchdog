import { pixelMonoFont } from "@/lib/font";
import Image from "next/image";
import { useState } from "react";

const TokenLogo = ({
  src,
  alt,
  size = 40,
}: {
  src?: string;
  alt: string;
  size?: number;
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-black to-gray-900 border border-[#00ff00]/10 rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        <span
          className={`${pixelMonoFont.className} text-lg sm:text-xl font-semibold text-[#00ff00]`}
        >
          {alt?.[0]?.toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
};

export default TokenLogo;
