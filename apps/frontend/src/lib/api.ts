import { type PublicSiteData, publicSiteDataSchema } from "@layered/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4004";

export async function loadPublicSiteData(): Promise<PublicSiteData> {
  const response = await fetch(`${API_URL}/api/site`);
  if (!response.ok) {
    throw new Error(`Failed to load site data: ${response.status}`);
  }
  return publicSiteDataSchema.parse(await response.json());
}
