import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Food & Expense Manager",
  description: "Manage group food ordering and financial settlements easily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
