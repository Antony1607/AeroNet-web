'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from '../shared.module.css';
import Modal from '@/components/Modal';

interface Ticket {
  id: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
  customer?: {
    full_name: string;
  };
  technician?: {
    id: string;
    full_name: string;
  };
}

interface Technician {
  id: string;
  full_name: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    technician_id: '',
    resolution_notes: '',
  });

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/technician');
      setTechnicians(res.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const openManageModal = (ticket: any) => {
    setSelectedTicketId(ticket.id);
    setFormData({
      status: ticket.status,
      technician_id: ticket.technician?.id || '',
      resolution_notes: ticket.resolution_notes || '',
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload: any = { status: formData.status };
      if (formData.technician_id) payload.technician_id = formData.technician_id;
      if (formData.resolution_notes) payload.resolution_notes = formData.resolution_notes;

      await api.patch(`/tickets/${selectedTicketId}`, payload);
      await fetchTickets();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      fetchTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert('Error al eliminar el ticket');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open':
        return <span className={`${styles.badge} ${styles.statusDanger}`} style={{ background: '#ff4d4f', color: '#fff' }}>Abierto</span>;
      case 'in_progress':
        return <span className={`${styles.badge} ${styles.statusWarning}`} style={{ background: '#ffa940', color: '#fff' }}>En Progreso</span>;
      case 'resolved':
      case 'closed':
        return <span className={`${styles.badge} ${styles.statusSuccess}`} style={{ background: '#52c41a', color: '#fff' }}>Cerrado</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'installation' || type === 'work_order') return <span className={`${styles.badge} ${styles.statusInfo}`} style={{ background: '#1890ff', color: '#fff' }}>Instalación</span>;
    if (type === 'support' || type === 'ticket') return <span className={`${styles.badge} ${styles.statusWarning}`} style={{ background: '#faad14', color: '#fff' }}>Soporte</span>;
    return <span className={styles.badge}>{type}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Tickets y Soporte</h1>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <div className={styles.empty}>No hay tickets registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Descripción</th>
                <th className={styles.th}>Técnico Asignado</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{t.customer?.full_name || 'N/A'}</td>
                  <td className={styles.td}>{getTypeBadge(t.type)}</td>
                  <td className={styles.td}>
                    <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description}
                    </div>
                  </td>
                  <td className={styles.td}>{t.technician?.full_name || <span style={{color: 'var(--text-secondary)'}}>No asignado</span>}</td>
                  <td className={styles.td}>{getStatusBadge(t.status)}</td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openManageModal(t)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Gestionar</button>
                      <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Gestionar Ticket */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Ticket">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Estado del Ticket</label>
            <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Técnico Asignado</label>
            <select name="technician_id" value={formData.technician_id} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
              <option value="">Sin Asignar</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.full_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Notas de Resolución (Respuesta al cliente)</label>
            <textarea 
              name="resolution_notes" 
              value={formData.resolution_notes || ''} 
              onChange={handleInputChange} 
              rows={3}
              placeholder="Escribe la solución que se le mostrará al cliente..."
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', resize: 'vertical' }} 
            />
          </div>

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
