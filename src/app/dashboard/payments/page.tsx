'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from '../shared.module.css';

interface Payment {
  id: string;
  amount_received: string | number;
  payment_date: string;
  payment_method: string;
  transaction_reference: string;
  customer?: {
    full_name: string;
    document_number?: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pago?')) return;
    try {
      await api.delete(`/payments/${id}`);
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Error al eliminar el pago');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Registro de Pagos</h1>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando pagos...</div>
        ) : payments.length === 0 ? (
          <div className={styles.empty}>No hay pagos registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Fecha de Pago</th>
                <th className={styles.th}>Método</th>
                <th className={styles.th}>Referencia</th>
                <th className={styles.th}>Monto</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{pay.customer?.full_name || 'N/A'}</td>
                  <td className={styles.td}>{new Date(pay.payment_date).toLocaleString()}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.statusInfo}`} style={{ background: '#1890ff', color: '#fff' }}>
                      {pay.payment_method === 'mercadopago' ? 'Mercado Pago' : pay.payment_method}
                    </span>
                  </td>
                  <td className={styles.td}>{pay.transaction_reference || '-'}</td>
                  <td className={styles.td} style={{ color: '#52c41a', fontWeight: 600 }}>
                    S/ {Number(pay.amount_received).toFixed(2)}
                  </td>
                  <td className={styles.td}>
                    <button onClick={() => handleDelete(pay.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
