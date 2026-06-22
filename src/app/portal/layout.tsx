'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { 
  Home, 
  FileText, 
  LifeBuoy, 
  LogOut,
  User,
  Package,
  CreditCard
} from 'lucide-react';
import styles from './portal.module.css';

const navItems = [
  { href: '/portal', label: 'Mi Resumen', icon: Home },
  { href: '/portal/profile', label: 'Mi Perfil', icon: User },
  { href: '/portal/plans', label: 'Planes', icon: Package },
  { href: '/portal/debts', label: 'Mis Deudas', icon: CreditCard },
  { href: '/portal/invoices', label: 'Mis Facturas', icon: FileText },
  { href: '/portal/tickets', label: 'Soporte', icon: LifeBuoy },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('userRole');
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - Específico para clientes */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Mi Aeronet</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/portal');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <User size={20} />
            Portal de Cliente
          </div>
          <div className={styles.headerUser}>
            <Link href="/portal/profile" style={{ textDecoration: 'none' }}>
              <div className={styles.avatar} style={{ cursor: 'pointer' }}>A</div>
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
