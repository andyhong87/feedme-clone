"use server";

import { convertPage, type ConvertResult } from "./convert-page";

export async function convertUrl(url: string): Promise<ConvertResult> {
  return convertPage(url);
}
