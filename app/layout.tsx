import "../lib/fonts/_active.css";
import "../lib/fonts/_vars.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI部下指導シミュレーター | ハラスメント80点を超えるな！",
  description:
    "高校生向けオープンキャンパス体験ゲーム。ハラスメントにならない具体的な指導を考えよう。",
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
        {children}
      </body>
    </html>
  );
}
