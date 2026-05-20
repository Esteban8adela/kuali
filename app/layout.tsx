import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kualisto",
  description: "Luxury culinary management at sea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
