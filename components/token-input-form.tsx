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
                <FormLabel className="text-sm font-medium text-gray-400">
                  Wallet Address
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Enter a wallet address (0x...)"
                      {...field}
                      disabled={isLoading}
                      aria-label="Wallet Address Input"
                      className="pl-10 py-6 bg-white/5 border-gray-800 focus:ring-[#FA4C15] focus:border-[#FA4C15]"
                    />
                  </FormControl>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Search className="h-5 w-5" />
                  </div>
                </div>
                <div className="pt-1">
                  <FormMessage className="text-red-400 text-xs" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-6 bg-gradient-to-r from-[#FA4C15] to-[#FF8A3D] hover:opacity-90 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <span>Analyzing Wallet...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Scan for Spam Tokens</span>
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
