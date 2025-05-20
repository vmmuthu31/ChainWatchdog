import { AlertTriangle, Search, ShieldCheck } from "lucide-react";

function CovalentTabSelector({
  activeTab,
  setActiveTab,
  isConnected,
}: {
  activeTab: "search" | "wallet" | "recent";
  setActiveTab: (tab: "search" | "wallet" | "recent") => void;
  isConnected: boolean;
}) {
  return (
    <div className="flex p-1 bg-black/80 border border-[#00ff00]/50 rounded-lg overflow-hidden mb-4">
      <button
        className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
          activeTab === "search"
            ? "bg-[#00ff00] text-black"
            : "text-[#00ff00] hover:bg-black/90"
        }`}
        onClick={() => setActiveTab("search")}
      >
        <Search className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
        <span>Search</span>
      </button>
      {isConnected && (
        <button
          className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
            activeTab === "wallet"
              ? "bg-[#00ff00] text-black"
              : "text-[#00ff00] hover:bg-black/90"
          }`}
          onClick={() => setActiveTab("wallet")}
        >
          <ShieldCheck className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
          <span>My Wallet</span>
        </button>
      )}
      <button
        className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
          activeTab === "recent"
            ? "bg-[#ff0000] text-white"
            : "text-[#ff0000] hover:bg-black/90"
        }`}
        onClick={() => setActiveTab("recent")}
      >
        <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
        <span>Recent Spam</span>
      </button>
    </div>
  );
}

export default CovalentTabSelector;
