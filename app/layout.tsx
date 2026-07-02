import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/session";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description:
    "Book private cars or shared seats from Hisar to Chandigarh, Delhi Peeragarhi and IGI Airport. Home pickup, online or cash payment.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileTabBar loggedIn={!!user} />
      </body>
    </html>
  );
}
