import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rocky Trading Co. - Premium Vehicles & Loading Ramps",
    template: "%s - Rocky Trading Co.",
  },
  description:
    "Rocky Trading Co. in Winnipeg, MB — Your trusted partner in premium vehicles and heavy-duty loading ramps.",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
