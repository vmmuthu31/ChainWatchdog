import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";
import { pixelMonoFont } from "@/lib/font";
import { toast } from "sonner";
interface WaitlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
function WaitlistDialog({ isOpen, onClose }: WaitlistDialogProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formID = process.env.NEXT_PUBLIC_FORMSPREE_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!formID) {
      console.error("Form ID is not defined");
      setIsSubmitting(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.info("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`https://formspree.io/f/${formID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {" "}
      <DialogContent className="bg-black/95 border border-[#00ffff]/30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle
            className={`${pixelMonoFont.className} text-[#00ffff] text-xl`}
          >
            {" "}
            Request Early Access{" "}
          </DialogTitle>{" "}
          <DialogDescription className="text-gray-400">
            {" "}
            Get First Dibs on Our AI Agent!{" "}
          </DialogDescription>{" "}
        </DialogHeader>{" "}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {" "}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 bg-black/50 border border-[#00ffff]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00ffff] transition-colors"
            />{" "}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-4 py-2 ${pixelMonoFont.className} bg-[#00ffff]/10 hover:bg-[#00ffff]/20 border border-[#00ffff]/40 text-[#00ffff] rounded-lg transition-colors`}
            >
              {" "}
              {isSubmitting ? "Claiming..." : "Claim My Spot"}{" "}
            </button>{" "}
          </form>
        ) : (
          <div className="mt-4 text-center text-[#00ffff]">
            {" "}
            Thanks for joining! We&apos;ll notify you when we launch.{" "}
          </div>
        )}{" "}
      </DialogContent>{" "}
    </Dialog>
  );
}

export default WaitlistDialog;
