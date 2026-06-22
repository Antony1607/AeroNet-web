'use client';

import { useEffect, useState } from 'react';
import { FileText, Wifi, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import styles from './portal.module.css';
import { api } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  speed_mbps: number;
  description: string;
}

interface Service {
  id: string;
  status: string;
  address_text: string;
  plan: {
    name: string;
    price: number;
  };
}

export default function PortalPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const servicesRes = await api.get('/services/my-services');
      setServices(servicesRes.data);
    } catch (err: any) {
      if (err.response && (err.response.status === 404 || err.response.status === 403)) {
        // Prospecto, ignorar silenciosamente
        setServices([]);
      } else {
        console.error('Error fetching data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando tu portal...</div>;
  }

  // 1. EL CLIENTE AÚN NO TIENE SERVICIOS (Es un prospecto)
  if (services.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ display: 'inline-flex', padding: '2rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)', flexDirection: 'column', alignItems: 'center' }}>
          <Package size={64} color="#6366F1" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>No tienes servicios activos</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
            Para comenzar a disfrutar de nuestra conexión de alta velocidad, visita nuestro catálogo de planes.
          </p>
          <a href="/portal/plans" className={styles.btnPrimary} style={{ textDecoration: 'none' }}>
            Ver Catálogo de Planes
          </a>
        </div>
      </div>
    );
  }

  // 2. EL CLIENTE TIENE AL MENOS UN SERVICIO (Puede ser pending o active)
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Resumen</h1>
        <p className={styles.pageSubtitle}>Gestiona tus servicios, facturas y soporte técnico.</p>
      </div>

      {services.map((svc) => {
        const isPending = svc.status === 'pending';
        return (
          <div key={svc.id} style={{ marginBottom: '3rem' }}>
            {/* Header del Servicio */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: isPending ? '#F59E0B' : '#10B981',
                boxShadow: `0 0 10px ${isPending ? '#F59E0B' : '#10B981'}`
              }}></div>
              <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: 0 }}>
                {svc.plan?.name} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>en {svc.address_text}</span>
              </h2>
            </div>

            {isPending && (
              <div className={styles.banner} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.bannerIcon}>
                  <AlertTriangle size={32} color="#F59E0B" />
                </div>
                <div>
                  <h3 className={styles.bannerTitle}>Instalación en progreso</h3>
                  <p className={styles.bannerText}>
                    Estamos procesando tu solicitud para este plan. Un técnico te contactará muy pronto.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.grid}>
              {/* Card 1: Estado del servicio */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper} style={{ background: isPending ? '#FEF3C7' : '#D1FAE5' }}>
                    <Wifi size={24} color={isPending ? '#F59E0B' : '#10B981'} />
                  </div>
                  <h2 className={styles.cardTitle}>Estado de Red</h2>
                </div>
                <div className={styles.cardValue} style={{ color: isPending ? '#F59E0B' : '#10B981' }}>
                  {isPending ? 'Pendiente' : 'Activo'}
                </div>
                <p className={styles.cardTrend}>
                  {isPending ? 'Esperando visita técnica.' : 'Tu conexión está funcionando perfectamente.'}
                </p>
              </div>

              {/* Card 2: Deuda actual - Ahora dice Ir a mis facturas */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper} style={{ background: '#E0E7FF' }}>
                    <FileText size={24} color="#6366F1" />
                  </div>
                  <h2 className={styles.cardTitle}>Facturación</h2>
                </div>
                <div className={styles.cardValue}>
                  <span style={{ fontSize: '1.5rem', color: '#64748b' }}>S/</span> {isPending ? '0.00' : svc.plan?.price.toFixed(2)}
                </div>
                <p className={styles.cardTrend}>
                  <a href="/portal/invoices" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 600 }}>Ver y pagar mis facturas →</a>
                </p>
              </div>

              {/* Card 3: Soporte */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper} style={{ background: '#FCE7F3' }}>
                    <AlertTriangle size={24} color="#EC4899" />
                  </div>
                  <h2 className={styles.cardTitle}>¿Problemas?</h2>
                </div>
                <p className={styles.cardTrend} style={{ marginTop: '0.5rem', lineHeight: 1.5 }}>
                  <a href="/portal/tickets" style={{ color: '#EC4899', textDecoration: 'none', fontWeight: 600 }}>Abrir un ticket de soporte →</a>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
