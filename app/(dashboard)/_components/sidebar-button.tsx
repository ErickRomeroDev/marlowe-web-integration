"use client"

import Image from 'next/image';
import Link from 'next/link';

export interface SidebarButtonProps {
  label: string;
  imageSrc: string;
  href: string;
}

export const SidebarButton = ({ label, imageSrc, href }: SidebarButtonProps) => {
  return (
    <Link href={href} passHref>
      <button className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
        <Image src={imageSrc} alt={label} width={24} height={24} className="mr-3" />
        <span>{label}</span>
      </button>
    </Link>
  );
}
