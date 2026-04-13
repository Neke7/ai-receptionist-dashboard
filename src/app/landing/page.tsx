import type { Metadata } from "next";
import LandingPage from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Oxphi — Your AI Receptionist, Always On",
  description:
    "Oxphi answers every call, books appointments 24/7, and turns conversations into qualified leads so you never miss another customer.",
};

export default function Landing() {
  return <LandingPage />;
}
