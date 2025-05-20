import { pixelMonoFont } from "@/lib/font";
import { BaseSyntheticEvent } from "react";

import * as z from "zod";

type FormData = {
  userQuestion: string;
};

type SuggestedQuestionsProps = {
  form: {
    setValue: (field: keyof FormData, value: string) => void;
    handleSubmit: (
      callback: (data: FormData) => void | Promise<void>
    ) => (e?: BaseSyntheticEvent) => void;
  };
  onSubmit: (data: FormData) => void | Promise<void>;
};

function SuggestedQuestions({ form, onSubmit }: SuggestedQuestionsProps) {
  return (
    <div className="mb-6 mt-2">
      <h3
        className={`${pixelMonoFont.className} text-base text-[#00ffff] mb-2 flex items-center`}
      >
        <span className="inline-block w-2 h-2 bg-[#00ffff] rounded-full mr-2"></span>
        SUGGESTED QUESTIONS
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "What is a honeypot token and how can I detect one?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          What is a honeypot token and how can I detect one?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "How to identify spam tokens in my wallet?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          How to identify spam tokens in my wallet?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "What are safe ways to sell tokens with high slippage?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          What are safe ways to sell tokens with high slippage?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "How to protect my wallet from dust attacks?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          How to protect my wallet from dust attacks?
        </button>
      </div>
    </div>
  );
}

export default SuggestedQuestions;
