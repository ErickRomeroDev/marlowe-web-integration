import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseADA = (num: number) => {
  const lovelace = num * 1000000;  
  return lovelace;
};

export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}