import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';
import { GlobalStatusBar } from '../components/GlobalStatusBar';
import { PresentationModeBar } from '../components/PresentationModeBar';

export const metadata: Metadata = {
  title: 'Umbrella — Climate Risk Command Center for Microfinance',
  description:
    'Institutional climate intelligence and proactive portfolio risk management for rural microfinance institutions in India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased">
        <PresentationModeBar />
        <Sidebar />
        <main className="ml-64 min-h-screen pb-12 flex flex-col">
          {children}
        </main>
        <GlobalStatusBar />
      </body>
    </html>
  );
}
