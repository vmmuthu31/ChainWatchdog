import { pixelFont, pixelMonoFont } from "@/lib/font";
import Image from "next/image";
import Link from "next/link";

function Footer() {
  return (
    <footer className="w-full border-t border-[#00ff00]/20 backdrop-blur-md bg-black/50 p-4 sm:p-6 md:p-8 text-center mt-10">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-6 sm:gap-8 py-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="RugProof Logo"
                width={40}
                height={40}
                className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
              />
              <p
                className={`${pixelFont.className} text-2xl sm:text-3xl font-semibold text-[#00ff00]`}
              >
                RugProof
              </p>
            </div>
            <p
              className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ffff] mb-4 sm:text-left`}
            >
              RETRO FUTURISM IN DIGITAL FORM
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end max-w-md">
            <p
              className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400 sm:text-right leading-relaxed`}
            >
              RugProof helps you identify and protect against crypto scams, spam
              tokens, and honeypots across multiple blockchains.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-end gap-3">
              <span
                className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400`}
              >
                Powered by{" "}
                <Link
                  href="https://goldrush.dev/docs/resources/enhanced-spam-lists"
                  className="text-[#ff00ff] font-medium"
                >
                  Covalent
                </Link>
              </span>
              <span className="text-gray-500 mx-1">•</span>
              <span
                className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400`}
              >
                Built by{" "}
                <span className="text-[#00ffff] font-medium">ForgeX</span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#00ff00]/10 mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center">
          <p className={`${pixelMonoFont.className} text-base text-gray-500`}>
            © {new Date().getFullYear()} RugProof. All rights reserved.
          </p>
          <div className="flex mt-3 sm:mt-0 gap-4">
            <Link
              href="/"
              className={`${pixelMonoFont.className} text-base text-[#00ff00] hover:text-[#00ffff] transition-colors`}
            >
              SPAM DETECTION
            </Link>
            <Link
              href="/honeypot"
              className={`${pixelMonoFont.className} text-base text-[#ffa500] hover:text-[#ffcc00] transition-colors`}
            >
              HONEYPOT CHECKER
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
