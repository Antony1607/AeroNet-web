'use client';

import { useEffect, useState } from 'react';
import { FileText, CreditCard, ExternalLink, Receipt, Building2, CheckCircle2, Clock } from 'lucide-react';
import styles from '../portal.module.css';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  period: string;
  total: number;
  status: string;
  due_date: string;
  payment_link?: string;
  short_payment_url?: string;
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/my-debts');
      const allItems: Invoice[] = res.data?.items || res.data || [];
      const paidInvoices = allItems.filter(inv => inv.status === 'paid' || inv.status === 'invoiced');
      setInvoices(paidInvoices);
    } catch (err: any) {
      if (err.response && (err.response.status === 404 || err.response.status === 403)) {
        // Prospecto o cliente sin facturas, ignorar silenciosamente
        setInvoices([]);
      } else {
        console.error('Error fetching invoices:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoice: Invoice) => {
    if (!confirm('¿Deseas pagar esta factura localmente de manera simulada?')) return;
    
    setPayingId(invoice.id);
    try {
      await api.post(`/payments/simulate/${invoice.id}`);
      alert('Pago procesado localmente con éxito.');
      await fetchInvoices(); // Recarga la lista de facturas
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      alert(error.response?.data?.message || 'Error al procesar el pago localmente');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando facturas...</div>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis Facturas</h1>
        <p className={styles.pageSubtitle}>Revisa tu historial de comprobantes y boletas pagadas.</p>
      </div>

      {invoices.length === 0 ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={64} color="#CBD5E1" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#1E1B4B', marginBottom: '0.5rem' }}>Aún no tienes facturas pagadas</h3>
          <p style={{ color: '#64748b' }}>Tu historial de recibos aparecerá aquí después de pagar tus deudas.</p>
        </div>
      ) : (
        <div className={styles.card} style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#475569' }}>Periodo</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#475569' }}>Vencimiento</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#475569' }}>Monto</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#475569' }}>Estado</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#475569' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#1E293B' }}>{inv.period}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#0F172A' }}>
                    S/ {Number(inv.total).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {inv.status === 'paid' || inv.status === 'invoiced' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', background: '#D1FAE5', color: '#059669', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <CheckCircle2 size={14} /> Pagado
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {inv.status === 'paid' || inv.status === 'invoiced' ? (
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.get(`/electronic-documents/invoice/${inv.id}`);
                            if(res.data && res.data.length > 0 && res.data[0].pdf_url) {
                              window.open(res.data[0].pdf_url, '_blank');
                            } else {
                              alert('Boleta en proceso de generación, por favor espera unos segundos.');
                            }
                          } catch(err) {
                            alert('No se encontró boleta asociada aún.');
                          }
                        }}
                        style={{ color: '#059669', border: '1px solid #059669', background: 'transparent', borderRadius: '4px', padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                        <Receipt size={16} /> Ver Boleta
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
