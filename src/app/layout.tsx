import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aeronet - Gestión de Internet',
  description: 'Panel de administración y gestión para Aeronet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
