import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

export function positiveBigIntValidator(value: string) {
  try {
    if (BigInt(value) > 0) {
      return true;
    } else {
      return "The amount must be greater than 0";
    }
  } catch (e) {
    return "The amount must be a number";
  }
}

export function dateInFutureValidator(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return "Invalid date";
  }
  if (d <= new Date()) {
    return "The date must be in the future";
  }
  return true;
}

