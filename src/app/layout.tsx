import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CNT Gabon — Billetterie en ligne',
  description: 'Achetez vos billets de transport en ligne pour tous vos trajets au Gabon. Paiement sécurisé par Mobile Money.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={frFR as any}>
      <html lang="fr" className={cn("font-sans", inter.variable)}>
        <body>
          {children}
          <Toaster richColors position="bottom-right" expand={true} />
        </body>
      </html>
    </ClerkProvider>
  )
}
