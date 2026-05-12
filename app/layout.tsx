import type { Metadata } from "next";
import AppProviders from "../components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Agent Espacio",
  description: "Collaborative workspace for AI agents and humans",
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
