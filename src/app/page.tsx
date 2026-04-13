import { cookies } from "next/headers";

import ClientDashboard from "@/components/client-dashboard";
import LandingPage from "@/components/landing-page";

/**
 * Root route serves one of two experiences:
 *   - Signed-in clients see their dashboard (the existing ClientDashboard).
 *   - Anonymous visitors see the public Oxphi landing page.
 *
 * The login cookie is httpOnly, so the decision has to happen in this server
 * component rather than client-side. Signed-in users who want to browse the
 * marketing site can still reach it directly at /landing.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("client_api_key")?.value?.trim();

  if (apiKey) {
    return <ClientDashboard />;
  }

  return <LandingPage />;
}
