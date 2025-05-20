import { pixelFont, pixelMonoFont } from "@/lib/font";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";

function TopHolders({
  holdersResult,
}: {
  holdersResult: {
    holders: {
      address: string;
      balance: string;
      alias: string;
      isContract: boolean;
    }[];
    totalSupply: string;
  };
}) {
  return (
    <div className="w-full max-w-2xl mt-6 animate-fade-in">
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
            <Info className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffa500]" />
          </div>
          <h3
            className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
          >
            TOP TOKEN HOLDERS
          </h3>
        </div>

        <div className="mb-4">
          <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/20 mb-2">
            <div className="flex justify-between items-center">
              <span
                className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
              >
                Total Supply:
              </span>
              <span
                className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
              >
                {BigInt(holdersResult.totalSupply).toLocaleString()} tokens
              </span>
            </div>
          </div>
        </div>

        {holdersResult.holders.length === 0 ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-[#ffa500]" />
            <h4
              className={`${pixelMonoFont.className} text-lg font-medium text-[#ffa500] mb-2`}
            >
              NO HOLDERS FOUND
            </h4>
            <p
              className={`${pixelMonoFont.className} text-base text-[#00ffff]`}
            >
              No token holders were found for this token on the selected chain.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ffa500]/30">
                    <th
                      className={`${pixelMonoFont.className} text-left p-3 text-[#ffa500] text-base sm:text-lg`}
                    >
                      Address
                    </th>
                    <th
                      className={`${pixelMonoFont.className} text-right p-3 text-[#ffa500] text-base sm:text-lg`}
                    >
                      Balance
                    </th>
                    <th
                      className={`${pixelMonoFont.className} text-center p-3 text-[#ffa500] text-base sm:text-lg`}
                    >
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holdersResult.holders.map((holder, index) => {
                    const holderBalance = BigInt(holder.balance);
                    const totalSupply = BigInt(holdersResult.totalSupply);
                    const percentage =
                      totalSupply > 0
                        ? Number(
                            (holderBalance * BigInt(10000)) / totalSupply
                          ) / 100
                        : 0;

                    return (
                      <tr
                        key={holder.address}
                        className={`${
                          index % 2 === 0 ? "bg-black/30" : "bg-black/50"
                        } hover:bg-[#ffa500]/10 transition-colors`}
                      >
                        <td
                          className={`${pixelMonoFont.className} p-3 text-[#00ffff] text-base`}
                        >
                          <a
                            href={`https://etherscan.io/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#00ffff] flex items-center gap-1"
                          >
                            {holder.address}
                            <ExternalLink className="inline-block h-4 w-4" />
                          </a>
                          {holder.alias && (
                            <span className="text-sm text-[#ff00ff]">
                              {holder.alias}
                            </span>
                          )}
                        </td>
                        <td
                          className={`${pixelMonoFont.className} p-3 text-right text-[#00ffff] text-base`}
                        >
                          <div>{holderBalance.toLocaleString()}</div>
                          <div className="text-sm text-[#00ffaa]">
                            {percentage.toFixed(2)}%
                          </div>
                        </td>
                        <td
                          className={`${pixelMonoFont.className} p-3 text-center`}
                        >
                          {holder.isContract ? (
                            <span className="px-3 py-1 bg-[#ff00ff]/10 text-[#ff00ff] rounded-full text-sm">
                              Contract
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-[#00ff00]/10 text-[#00ff00] rounded-full text-sm">
                              Wallet
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30">
              <div className="flex gap-3 items-start">
                <Info className="h-5 w-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                <p
                  className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ffaa00]`}
                >
                  This endpoint shows up to 50 top holders. Premium API access
                  allows retrieving more holders.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopHolders;
