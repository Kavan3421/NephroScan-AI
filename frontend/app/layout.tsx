import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AntdProvider from "@/components/custom/AntdProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NephroScan AI | Medical CT Kidney Disease Detection System",
  description:
    "Production-grade Medical AI Diagnostic System powered by VGG16 Transfer Learning and ONNX Runtime. Automated multi-class detection across 12,446 Kaggle CT Kidney scans: Normal, Cyst, Stone, Tumor.",
  keywords: [
    "Kidney Disease Detection",
    "Medical AI",
    "CT Scan Classification",
    "ONNX Runtime",
    "FastAPI",
    "Next.js",
    "Deep Learning",
    "Healthcare ML",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
