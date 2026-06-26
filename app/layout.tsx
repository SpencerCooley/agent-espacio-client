import type { Metadata } from "next";
import AppProviders from "../components/providers/AppProviders";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Agent Espacio";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Collaborative workspace for AI agents and humans";
const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE_URL;

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    siteName: siteName,
    images: ogImage ? [{ url: ogImage }] : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ogImage ? [ogImage] : undefined,
  },
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON_URL || "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
