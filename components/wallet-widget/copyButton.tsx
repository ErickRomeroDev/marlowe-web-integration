import Image from "next/image";
import { useState } from "react";
import { ICON_SIZES } from "@/constants";

interface CopyButtonProps {
  text: string;
}

export const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      });
    } catch (err) {
      console.error("Failed to copy address: ", err);
    }
  };

  return (
    <div>
      {copied ? (
        <div className="animate-bounce">
          <abbr title="Copied!">
            <Image
              src="/check.svg"
              alt="✓"
              width={ICON_SIZES.M}
              height={ICON_SIZES.M}
            />
          </abbr>
        </div>
      ) : (
        <div onClick={copyToClipboard}>
          <abbr title="Copy Address">
            <Image
              src="/copy.svg"
              alt={"Copy"}
              width={ICON_SIZES.M}
              height={ICON_SIZES.M}
            />
          </abbr>
        </div>
      )}
    </div>
  );
};
