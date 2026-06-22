'use client';

import { useEffect, useState } from 'react';
import { Users, Zap, FileText, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './page.module.css';

// Componente para una tarjeta de estadística
function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className={`${styles.card} glass-panel`}>
      <div className={styles.iconWrapper}>
        <Icon size={28} />
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={styles.cardValue}>{value}</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState({
    customers: '-',
    plans: '-',
    pendingInvoices: '-',
    recentPayments: '-'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customersRes, plansRes, invoicesRes, paymentsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/plans'),
          api.get('/invoices'),
          api.get('/payments')
        ]);

        const customersCount = customersRes.data?.length || 0;
        const plansCount = plansRes.data?.length || 0;
        const pendingCount = (invoicesRes.data || []).filter((inv: any) => inv.status === 'pending').length;
        const paymentsCount = paymentsRes.data?.length || 0;

        setStats({
          customers: customersCount.toString(),
          plans: plansCount.toString(),
          pendingInvoices: pendingCount.toString(),
          recentPayments: paymentsCount.toString()
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className={`${styles.title} heading-gradient`}>Resumen del Sistema</h1>
      
      <div className={styles.grid}>
        <StatCard icon={Users} label="Clientes Totales" value={stats.customers} />
        <StatCard icon={Zap} label="Planes Registrados" value={stats.plans} />
        <StatCard icon={FileText} label="Facturas Pendientes" value={stats.pendingInvoices} />
        <StatCard icon={CreditCard} label="Pagos Recientes" value={stats.recentPayments} />
      </div>
    </div>
  );
}
