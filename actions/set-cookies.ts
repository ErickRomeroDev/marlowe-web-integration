"use server";

import { cookies } from "next/headers";

export const createCookie = async (data: string) => {    
  cookies().set("walletInfo", data );
};
