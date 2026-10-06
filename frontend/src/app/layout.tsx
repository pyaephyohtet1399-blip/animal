import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Myanmar } from "next/font/google";

import { Providers } from "@/providers/store-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { APP_NAME, COUNTRY_NAME, DISTRICT_NAME } from "@/config/app";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoMyanmar = Noto_Sans_Myanmar({
  variable: "--font-noto-myanmar",
  subsets: ["myanmar"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: `Livestock census data management for ${DISTRICT_NAME}, ${COUNTRY_NAME}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="my"
      className={`${geistSans.variable} ${geistMono.variable} ${notoMyanmar.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          <ProtectedRoute>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ProtectedRoute>
        </Providers>
      </body>
    </html>
  );
}
