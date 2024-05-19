import Image from "next/image";
import { useState } from "react";

import { ICON_SIZES } from "@/constants";
import { Hint } from "@/components/hint";
import { toast } from "sonner";

interface CopyButtonProps {
  text: string;
}

export const CopyButton = ({ text }: CopyButtonProps) => {

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text).then(() => {
        toast.success("Address copied to clipboard!")
      });
      
    } catch (err) {
      console.error("Failed to copy address: ", err);
      toast.error("Failed to copy address.")
    }
  };

  return (
        <div>
          <Hint
          label="copy address"
          side="bottom"
          align="start"
          sideOffset={14}
          >
            <button
              className="flex items-center justify-center h-[48px] w-[48px] rounded-full  transition-colors bg-[#ECEBF1] hover:bg-[#ECEBF1]/70"
              onClick={copyToClipboard}
            >
              <Image src="/copy.svg" alt="Copy" width={18} height={18} />
            </button>
          </Hint>
        </div>
  );
};
