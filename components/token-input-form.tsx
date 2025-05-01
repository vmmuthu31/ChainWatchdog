"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full max-w-lg space-y-6"
      >
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="tokenAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={`${pixelMonoFont.className} text-sm font-medium text-[#00ff00]`}
                >
                  WALLET ADDRESS
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Enter a wallet address (0x...)"
                      {...field}
                      disabled={isLoading}
                      aria-label="Wallet Address Input"
                      className={`${pixelMonoFont.className} pl-10 py-6 bg-black/80 border-[#00ff00]/50 text-[#00ffff] focus:ring-[#00ff00] focus:border-[#00ff00] placeholder:text-[#00ffaa]/50`}
                    />
                  </FormControl>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00ff00]">
                    <Search className="h-5 w-5" />
                  </div>
                </div>
                <div className="pt-1">
                  <FormMessage className="text-[#ff0000] text-xs" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className={`${pixelFont.className} w-full py-6 bg-black border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] rounded-xl transition-all duration-200 shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)]`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <span>ANALYZING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span>SCAN FOR SPAM</span>
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
