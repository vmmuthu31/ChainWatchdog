import { pixelMonoFont } from "@/lib/font";
import { SuggestedQuestionsProps } from "@/lib/types";

function SampleTokens({ form, onSubmit }: SuggestedQuestionsProps) {
  return (
    <div className="mb-2">
      <h3
        className={`${pixelMonoFont.className} text-base text-[#00ffff] mb-2 flex items-center`}
      >
        <span className="inline-block w-2 h-2 bg-[#00ffff] rounded-full mr-2"></span>
        SAMPLES FOR ANALYSIS
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Check this token for honeypot 0xC65d6849550bccA4F8f5e096565A874aa70B816c"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#ffaa00]/30 rounded-md text-[#ffcc00] hover:bg-[#ffaa00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#ffaa00] rounded-full mr-2"></span>
          Honeypot scan: 0x3ee...5411 (BSC)
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Scan this wallet for spam tokens: 0x5b17c05bf59D82266e29C0Ca86aa1359F9cE801A on Base"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ffff]/30 rounded-md text-[#00ffff] hover:bg-[#00ffff]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ffff] rounded-full mr-2"></span>
          Spam scan: 0xd8d...6045 (ETH wallet)
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Check if this token is in the spam database: 0x66c55fddc9599602e57d2092ba7e16f7d6fd798e on Ethereum"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00aa00]/30 rounded-md text-[#00ffaa] hover:bg-[#00aa00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00aa00] rounded-full mr-2"></span>
          Spam check: 0x7d1...ebb0 (Polygon)
        </button>
      </div>
    </div>
  );
}

export default SampleTokens;
