import "../lib/fonts/_active.css";
import "../lib/fonts/_vars.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI部下指導シミュレーター | ハラスメント80点を超えるな！",
  description:
    "高校生向けオープンキャンパス体験ゲーム。ハラスメントにならない具体的な指導を考えよう。",
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "512x512", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1b4b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className="antialiased font-body"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
