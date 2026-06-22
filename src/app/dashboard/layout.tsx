'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Ticket, 
  LogOut,
  Wrench
} from 'lucide-react';
import styles from './dashboard.module.css';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Clientes', icon: Users },
  { href: '/dashboard/plans', label: 'Planes', icon: Zap },
  { href: '/dashboard/services', label: 'Servicios', icon: Briefcase },
  { href: '/dashboard/invoices', label: 'Facturación', icon: FileText },
  { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/technicians', label: 'Técnicos', icon: Wrench },
];

export default function DashboardLayout({
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
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={`${styles.logo} heading-gradient`}>Aeronet</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
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
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
