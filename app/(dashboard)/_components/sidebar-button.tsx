"use client"

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export interface SidebarButtonProps {
  label: string;
  imageSrc: string[];
  href: string;
  currentUrl: string;
}

export const SidebarButton = ({ label, imageSrc, href, currentUrl }: SidebarButtonProps) => {
    const isActive = href === currentUrl
  return (
    <Link href={href} passHref>
      <button className={cn("flex items-center gap-3 p-3 w-full text-[17px] font-normal text-[#121216] rounded-[30px] ", isActive && "bg-[#121216] text-[#f5f5f8]", !isActive && " hover:bg-[#fafafa]")}>
        {isActive ? 
        <Image 
        src={imageSrc[0]} 
        alt={label} 
        width={20} 
        height={20} 
         />
         :
         <Image 
        src={imageSrc[1]} 
        alt={label} 
        width={20} 
        height={20} 
         />
    }
        <span>{label}</span>
      </button>
    </Link>
  );
}
