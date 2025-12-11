import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dexter - AI Financial Research Agent',
  description: 'An autonomous financial research agent that performs deep analysis using task planning and real-time market data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
