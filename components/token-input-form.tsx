"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { Press_Start_2P, VT323 } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const formSchema = z.object({
  tokenAddress: z.string().regex(ethAddressRegex, {
    message:
      "Invalid wallet address format. Address must start with '0x' followed by 40 hexadecimal characters.",
  }),
});

type TokenInputFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

// Add a custom CSS style block to prevent autofill background color
const AutofillStyleFix = () => (
  <style jsx global>{`
    /* Force text color for all states */
    input {
      color: #00ffff !important;
      -webkit-text-fill-color: #00ffff !important;
      background-color: black !important;
      caret-color: #00ff00 !important;
    }

    /* Handle autofill */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px black inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    /* Customize text selection colors */
    ::selection {
      background-color: rgba(0, 255, 0, 0.4) !important;
      color: #00ffff !important;
      -webkit-text-fill-color: #00ffff !important;
    }

    ::-moz-selection {
      background-color: rgba(0, 255, 0, 0.4) !important;
      color: #00ffff !important;
    }
  `}</style>
);

export function TokenInputForm({ onSubmit, isLoading }: TokenInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: "",
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  // Track the input element for styling
  const inputElementRef = React.useRef<HTMLInputElement | null>(null);

  // Apply styling directly after component mounts
  React.useEffect(() => {
    const applyInputStyles = () => {
      if (inputElementRef.current) {
        inputElementRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        inputElementRef.current.style.color = "#00ffff";
        inputElementRef.current.style.fontSize = "16px";
      }
    };

    // Apply initially
    applyInputStyles();

    // Apply styles on focus and blur events to maintain styling
    const inputElement = inputElementRef.current;
    if (inputElement) {
      const handleFocus = () => {
        inputElement.style.backgroundColor = "#0a0a0a";
        inputElement.style.color = "#00ffff";
      };

      const handleBlur = () => {
        inputElement.style.backgroundColor = "#111";
        inputElement.style.color = "#00ffff";
      };

      inputElement.addEventListener("focus", handleFocus);
      inputElement.addEventListener("blur", handleBlur);

      // Clean up
      return () => {
        inputElement.removeEventListener("focus", handleFocus);
        inputElement.removeEventListener("blur", handleBlur);
      };
    }
  }, []);

  return (
    <Form {...form}>
      <AutofillStyleFix />
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full max-w-lg space-y-6 sm:space-y-8"
      >
        <div className="space-y-2 sm:space-y-3">
          <FormField
            control={form.control}
            name="tokenAddress"
            render={({ field }) => {
              // Use a callback ref to apply styling when the element is created
              const inputRef = (element: HTMLInputElement) => {
                // Call the original ref from field
                if (typeof field.ref === "function") {
                  field.ref(element);
                }

                // Store the element in our ref
                inputElementRef.current = element;

                // Apply our custom styling
                if (element) {
                  element.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                  element.style.color = "#00ffff";
                  element.style.fontSize = "16px";
                }
              };

              return (
                <FormItem>
                  <FormLabel
                    className={`${pixelMonoFont.className} text-xl sm:text-2xl font-medium text-[#00ff00]`}
                  >
                    WALLET ADDRESS
                  </FormLabel>
                  <div className="relative w-full">
                    <FormControl>
                      <input
                        {...field}
                        ref={inputRef}
                        placeholder="Enter a wallet address (0x...)"
                        disabled={isLoading}
                        aria-label="Wallet Address Input"
                        className={`${pixelMonoFont.className} w-full pl-12 pr-4 py-5 sm:py-6 rounded-md bg-[#111] border border-[#00ff00]/50 text-[#00ffff] focus:ring-[#00ff00] focus:border-[#00ff00] focus:outline-none focus:ring-2 text-lg sm:text-xl md:text-2xl placeholder:text-[#00ffaa]/50`}
                        style={{
                          backgroundColor: "#111",
                          color: "#00ffff",
                          caretColor: "#00ff00",
                          fontSize: "18px",
                          textShadow: "0 0 2px rgba(0, 0, 0, 0.5)",
                          WebkitTextFillColor: "#00ffff",
                        }}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = "#0a0a0a";
                          e.target.style.color = "#00ffff";
                          e.target.style.fontSize = "18px";
                          e.target.style.webkitTextFillColor = "#00ffff";
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = "#111";
                          e.target.style.color = "#00ffff";
                          e.target.style.fontSize = "18px";
                          e.target.style.webkitTextFillColor = "#00ffff";
                        }}
                        onSelect={(e) => {
                          e.currentTarget.style.color = "#00ffff";
                          e.currentTarget.style.webkitTextFillColor = "#00ffff";
                        }}
                      />
                    </FormControl>
                    <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#00ff00]">
                      <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  <div className="pt-1">
                    <FormMessage className="text-[#ff0000] text-sm sm:text-base" />
                  </div>
                </FormItem>
              );
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className={`${pixelFont.className} w-full py-5 sm:py-6 md:py-7 bg-black border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] rounded-xl transition-all duration-200 shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] text-sm sm:text-base md:text-lg`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="relative">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              </div>
              <span>ANALYZING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>SCAN FOR SPAM</span>
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
