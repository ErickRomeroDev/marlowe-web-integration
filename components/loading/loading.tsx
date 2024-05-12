import Image from "next/image";
import { ICON_SIZES } from "@/constants";

interface LoadingProps {
  sizeDesktop?: (typeof ICON_SIZES)[keyof typeof ICON_SIZES];
  sizeMobile?: (typeof ICON_SIZES)[keyof typeof ICON_SIZES];
}

export const Loading = ({
  sizeDesktop = ICON_SIZES.XXXL,
  sizeMobile = ICON_SIZES.XXL,
}: LoadingProps) => {
  return (
    <>
      <div className="hidden animate-ping sm:block">
        <Image
          src="/marlowe.svg"
          alt="Loading..."
          height={sizeDesktop}
          width={sizeDesktop}
        />
      </div>
      <div className="block animate-ping sm:hidden">
        <Image
          src="/marlowe.svg"
          alt="Loading..."
          height={sizeMobile}
          width={sizeDesktop}
        />
      </div>
    </>
  );
};
