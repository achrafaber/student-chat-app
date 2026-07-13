import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MassarChat - Le Chat des Étudiants 🇲🇦",
  description: "Plateforme de chat pour les étudiants marocains - Connectez-vous avec votre Code Massar",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-retro-dark text-retro-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
