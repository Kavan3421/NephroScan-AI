import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NephroScan AI | Clinical Radiology Workstation",
  description:
    "Clinical-grade Diagnostic Radiology Workstation for Kidney CT analysis powered by VGG16 Transfer Learning and ONNX Runtime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0A0C10] text-slate-100 min-h-screen antialiased selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
