'use client';

import { useEffect, useState } from 'react';
import { RefreshCcw, CreditCard, Trash2, Plus, Zap, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import styles from '../shared.module.css';

interface Invoice {
  id: string;
  issue_date: string;
  due_date: string;
  amount: string;
  total: number;
  status: string;
  service_id?: string;
  service?: {
    customer?: {
      full_name: string;
    }
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [forcing, setForcing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    service_id: '',
    period: '',
    total: 0,
    status: 'pending',
    due_date: '',
    payment_link: '',
  });

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, service_id: res.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchServices();
  }, []);

  const handleGenerateMonthly = async () => {
    if (!confirm('¿Estás seguro de generar las deudas de este mes para todos los servicios activos?')) return;
    setGenerating(true);
    try {
      const today = new Date();
      const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      await api.post(`/invoices/generate-monthly?period=${period}`);
      alert('Deudas generadas correctamente.');
      fetchInvoices();
    } catch (error: any) {
      console.error('Error generating invoices:', error);
      alert(error.response?.data?.message || 'Error al generar facturas.');
    } finally {
      setGenerating(false);
    }
  };

  const handleForceBilling = async () => {
    if (!confirm('¿Estás seguro de forzar el proceso de facturación diaria ahora?')) return;
    setForcing(true);
    try {
      await api.post(`/invoices/force-billing`);
      alert('Proceso de facturación ejecutado correctamente.');
      fetchInvoices();
    } catch (error: any) {
      console.error('Error forcing billing:', error);
      alert(error.response?.data?.message || 'Error al forzar facturación.');
    } finally {
      setForcing(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      service_id: services.length > 0 ? services[0].id : '',
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      total: 0,
      status: 'pending',
      due_date: new Date().toISOString().split('T')[0],
      payment_link: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setIsEditing(true);
    setEditingId(inv.id);
    setFormData({
      service_id: inv.service_id || '',
      period: '', // Backend doesn't return period by default in GET /, you'd have to handle it if missing or let user rewrite
      total: inv.total || parseFloat(inv.amount) || 0,
      status: inv.status || 'pending',
      due_date: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
      payment_link: '', // Not returned in standard view
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (isEditing && editingId) {
        await api.patch(`/invoices/${editingId}`, {
          total: formData.total,
          status: formData.status,
          due_date: formData.due_date,
          payment_link: formData.payment_link
        });
      } else {
        await api.post('/invoices', formData);
      }
      await fetchInvoices();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || (isEditing ? 'Error al actualizar factura.' : 'Error al crear factura.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Error al eliminar la factura');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return <span className={`${styles.badge} ${styles.statusSuccess}`} style={{ background: '#52c41a', color: '#fff' }}>Pagado</span>;
      case 'pending':
        return <span className={`${styles.badge} ${styles.statusWarning}`} style={{ background: '#ffa940', color: '#fff' }}>Pendiente</span>;
      case 'overdue':
        return <span className={`${styles.badge} ${styles.statusDanger}`} style={{ background: '#ff4d4f', color: '#fff' }}>Vencido</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className={`${styles.title} heading-gradient`}>Facturación y Deudas</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
              onClick={handleGenerateMonthly} 
              className={styles.btnPrimary} 
              disabled={generating}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              {generating ? 'Generando...' : 'Generar (Mes)'}
            </button>
          <button 
              onClick={handleForceBilling} 
              className={styles.btnPrimary} 
              disabled={forcing}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#F59E0B' }}
            >
              <Zap size={16} style={{ display: 'inline', marginRight: '4px' }}/>
              {forcing ? 'Forzando...' : 'Forzar Diario'}
            </button>
          <button 
              onClick={handleOpenCreateModal} 
              className={styles.btnPrimary} 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#10B981' }}
            >
              <Plus size={16} style={{ display: 'inline', marginRight: '4px' }}/>
              Nueva Deuda
            </button>
        </div>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className={styles.empty}>No hay facturas registradas.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Emisión</th>
                <th className={styles.th}>Vencimiento</th>
                <th className={styles.th}>Monto</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{inv.service?.customer?.full_name || 'N/A'}</td>
                  <td className={styles.td}>{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : 'N/A'}</td>
                  <td className={styles.td}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}</td>
                  <td className={styles.td}>S/ {Number(inv.total || inv.amount).toFixed(2)}</td>
                  <td className={styles.td}>{getStatusBadge(inv.status)}</td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {inv.status.toLowerCase() !== 'paid' && (
                         <>
                           <button onClick={async () => {
                             try {
                               await api.post(`/invoices/${inv.id}/send-whatsapp`);
                               alert('Recordatorio de pago enviado por WhatsApp');
                             } catch(err) {
                               alert('Error al enviar recordatorio');
                             }
                           }} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                             <CreditCard size={16} /> Enviar Aviso WP
                           </button>
                           <button onClick={async () => {
                             if(!confirm('¿Estás seguro de marcar esta deuda como pagada en efectivo/transferencia?')) return;
                             try {
                               await api.post(`/payments/simulate/${inv.id}`);
                               alert('Pago registrado correctamente');
                               fetchInvoices();
                             } catch(err) {
                               alert('Error al registrar pago');
                             }
                           }} style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                             <CreditCard size={16} /> Marcar Pagado
                           </button>
                         </>
                      )}
                      {inv.status.toLowerCase() === 'paid' && (
                         <button onClick={async () => {
                           try {
                             const res = await api.get(`/electronic-documents/invoice/${inv.id}`);
                             if(res.data && res.data.pdf_link) {
                               window.open(res.data.pdf_link, '_blank');
                             } else {
                               alert('Boleta en proceso de generación, por favor espera unos segundos.');
                             }
                           } catch(err) {
                             alert('No se encontró boleta asociada aún.');
                           }
                         }} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                           <CreditCard size={16} /> Ver Boleta
                         </button>
                      )}
                      <button onClick={() => handleOpenEditModal(inv)} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} title="Editar">
                        <Edit size={16} /> Editar
                      </button>
                      <button onClick={() => handleDelete(inv.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Modal Nuevo/Editar Deuda */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Deuda" : "Nueva Deuda"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {!isEditing && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Servicio Asociado</label>
                <select name="service_id" value={formData.service_id} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
                  <option value="">Seleccione un servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.customer?.full_name} - {s.plan?.name} ({s.address_text})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Periodo (YYYY-MM)</label>
                <input type="text" name="period" value={formData.period} onChange={handleInputChange} required placeholder="2026-05" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Monto Total (S/)</label>
              <input type="number" name="total" value={formData.total} onChange={handleInputChange} required min="0" step="0.1" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Fecha Vencimiento</label>
              <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Estado Administrativo</label>
            <select name="status" value={formData.status} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
              <option value="pending">Pendiente de pago</option>
              <option value="paid">Pagado internamente</option>
              <option value="invoiced">Facturado (Legal)</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Link de Pago (Opcional)</label>
              <input type="text" name="payment_link" value={formData.payment_link} onChange={handleInputChange} placeholder="https://..." style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>
          )}

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Deuda')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Styles inline for spin animation */}
      <style dangerouslySetInnerHTML={{__html: `
        .${styles.spin} { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
