'use client';

import { useEffect, useState } from 'react';
import { FileText, CreditCard, Clock, X, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import styles from '../portal.module.css';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  period: string;
  total: number;
  status: string;
  due_date: string;
}

export default function PortalDebtsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'yape'>('tarjeta');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/my-debts');
      const allItems: Invoice[] = res.data?.items || res.data || [];
      const pendingDebts = allItems.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
      setInvoices(pendingDebts);
    } catch (err: any) {
      if (err.response && (err.response.status === 404 || err.response.status === 403)) {
        // Prospecto, ignorar silenciosamente
        setInvoices([]);
      } else {
        console.error('Error fetching invoices:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod('tarjeta');
    setShowSuccess(false);
    setIsProcessing(false);
  };

  const handleCloseModal = () => {
    if (isProcessing) return;
    setSelectedInvoice(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    setIsProcessing(true);
    
    try {
      // Simulamos 1.5s de delay para darle realismo a la animación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await api.post(`/payments/simulate/${selectedInvoice.id}`);
      
      setShowSuccess(true);
      
      // Cerrar modal y refrescar la tabla después de 2.5s
      setTimeout(() => {
        handleCloseModal();
        fetchInvoices();
      }, 2500);

    } catch (error: any) {
      console.error('Error initiating payment:', error);
      alert(error.response?.data?.message || 'Error al procesar el pago localmente');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando deudas...</div>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mis Deudas</h1>
        <p className={styles.pageSubtitle}>Revisa y cancela tus deudas pendientes de forma segura.</p>
      </div>

      {invoices.length === 0 ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FileText size={64} color="#CBD5E1" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#1E1B4B', marginBottom: '0.5rem' }}>Aún no tienes deudas registradas</h3>
          <p style={{ color: '#64748b' }}>Tus próximas deudas por pagar aparecerán aquí.</p>
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
                    {inv.status === 'pending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', background: '#FEF3C7', color: '#D97706', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <Clock size={14} /> Pendiente
                      </span>
                    )}
                    {inv.status === 'overdue' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', background: '#FEE2E2', color: '#DC2626', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <Clock size={14} /> Vencido
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button 
                      onClick={() => handleOpenModal(inv)}
                      className={styles.btnPrimary} 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <CreditCard size={16} /> Pagar ahora
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE PAGO (Diseño Simulado Realista) */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                {showSuccess ? 'Pago Completado' : 'Procesar Pago'}
              </h3>
              {!isProcessing && !showSuccess && (
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {showSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle size={64} color="#059669" />
                  </div>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#064e3b', marginBottom: '0.5rem' }}>¡Pago exitoso!</h4>
                  <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '0.5rem' }}>
                    Se abonaron S/ {Number(selectedInvoice.total).toFixed(2)} por el periodo {selectedInvoice.period}.
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Tu comprobante electrónico será enviado a tu correo o WhatsApp en unos minutos.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total a pagar</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0f172a' }}>
                      S/ {Number(selectedInvoice.total).toFixed(2)}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Periodo: {selectedInvoice.period}</p>
                  </div>

                  {/* Selector de métodos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => setPaymentMethod('tarjeta')}
                      style={{
                        padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${paymentMethod === 'tarjeta' ? '#4f46e5' : '#e2e8f0'}`,
                        background: paymentMethod === 'tarjeta' ? '#eef2ff' : 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                      }}
                    >
                      <CreditCard size={24} color={paymentMethod === 'tarjeta' ? '#4f46e5' : '#64748b'} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: paymentMethod === 'tarjeta' ? '#3730a3' : '#475569' }}>Tarjeta</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('yape')}
                      style={{
                        padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${paymentMethod === 'yape' ? '#00e19a' : '#e2e8f0'}`,
                        background: paymentMethod === 'yape' ? '#ecfdf5' : 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                      }}
                    >
                      <Smartphone size={24} color={paymentMethod === 'yape' ? '#059669' : '#64748b'} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: paymentMethod === 'yape' ? '#065f46' : '#475569' }}>Yape / Plin</span>
                    </button>
                  </div>

                  {/* Formulario Simulado */}
                  {paymentMethod === 'tarjeta' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.25rem' }}>Número de Tarjeta</label>
                        <input type="text" placeholder="0000 0000 0000 0000" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#94a3b8' }} value="4555 1234 5678 9012" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.25rem' }}>Vencimiento</label>
                          <input type="text" placeholder="MM/YY" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#94a3b8' }} value="12/28" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.25rem' }}>CVV</label>
                          <input type="text" placeholder="123" readOnly style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#94a3b8' }} value="***" />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'yape' && (
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                      <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Escanea con Yape o Plin</p>
                      <div style={{ width: '150px', height: '150px', background: '#e2e8f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>[CÓDIGO QR]</span>
                      </div>
                      <p style={{ color: '#059669', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>Aprobación automática en modo demo</p>
                    </div>
                  )}

                  <button 
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    style={{ 
                      width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', border: 'none',
                      background: isProcessing ? '#94a3b8' : '#4f46e5', color: 'white', fontWeight: 600, fontSize: '1rem',
                      cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.2s'
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className={styles.spin} size={20} /> Procesando pago...
                      </>
                    ) : (
                      'Confirmar Pago'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
