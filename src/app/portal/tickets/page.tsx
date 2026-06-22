'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, PlusCircle, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import styles from '../portal.module.css';
import { api } from '@/lib/api';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  category: string;
  created_at: string;
  resolution_notes?: string;
  service?: {
    address_text: string;
    plan?: { name: string };
  };
}

interface Service {
  id: string;
  address_text: string;
  plan: { name: string };
}

export default function PortalTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'RECLAMO',
    subject: '',
    description: '',
    service_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, servicesRes] = await Promise.all([
        api.get('/tickets/my-tickets'),
        api.get('/services/my-services')
      ]);
      setTickets(ticketsRes.data || []);
      setServices(servicesRes.data || []);
      
      // Auto-select first service if available
      if (servicesRes.data && servicesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, service_id: servicesRes.data[0].id }));
      }
    } catch (err: any) {
      if (err.response && (err.response.status === 404 || err.response.status === 403)) {
        // Prospecto, ignorar silenciosamente
        setTickets([]);
        setServices([]);
      } else {
        console.error('Error fetching tickets data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      category: 'RECLAMO',
      subject: '',
      description: '',
      service_id: services.length > 0 ? services[0].id : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description || !formData.service_id) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/tickets', {
        type: 'ticket',
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        service_id: formData.service_id
      });
      await fetchData(); // Recargar la lista
      handleCloseModal();
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Ocurrió un error al crear el ticket. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const translateCategory = (cat: string) => {
    const map: Record<string, string> = {
      'RECLAMO': 'Reclamo o Avería',
      'COBERTURA_WIFI': 'Problemas de Cobertura Wi-Fi',
      'PAUSA_VACACIONES': 'Pausar por Vacaciones',
      'MEJORA_PLAN': 'Mejorar mi Plan',
      'TRASLADO': 'Traslado de Domicilio'
    };
    return map[cat] || cat;
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando tickets...</div>;
  }

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.pageTitle}>Soporte Técnico</h1>
          <p className={styles.pageSubtitle}>¿Tienes algún problema con tu servicio? Abre un ticket y lo solucionaremos.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className={styles.btnPrimary} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
        >
          <PlusCircle size={20} /> Nuevo Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <LifeBuoy size={64} color="#CBD5E1" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#1E1B4B', marginBottom: '0.5rem' }}>No tienes tickets activos</h3>
          <p style={{ color: '#64748b' }}>Si experimentas lentitud o cortes, puedes abrir un ticket aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{ticket.subject}</h3>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.25rem',
                      background: '#F1F5F9', color: '#475569'
                    }}>
                      {translateCategory(ticket.category)}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                    Creado el {new Date(ticket.created_at).toLocaleDateString()} 
                    {ticket.service?.address_text && ` • Servicio en: ${ticket.service.address_text}`}
                  </p>
                </div>
                <div>
                  {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', background: '#D1FAE5', color: '#059669', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> {translateStatus(ticket.status)}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', background: '#FEF3C7', color: '#D97706', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
                      <Clock size={16} /> {translateStatus(ticket.status)}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '0.5rem', color: '#475569', fontSize: '0.95rem' }}>
                {ticket.description}
              </div>

              {ticket.resolution_notes && (
                <div style={{ padding: '1rem', background: '#EEF2FF', borderRadius: '0.5rem', color: '#3730A3', fontSize: '0.95rem', border: '1px solid #C7D2FE', display: 'flex', gap: '0.75rem' }}>
                  <AlertCircle size={20} color="#4F46E5" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Respuesta del Técnico:</strong><br/>
                    {ticket.resolution_notes}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR TICKET */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LifeBuoy size={24} color="#6366F1" />
                Abrir Nuevo Ticket
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Servicio Afectado</label>
                <select 
                  value={formData.service_id}
                  onChange={(e) => setFormData({...formData, service_id: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  {services.length === 0 && <option value="">No tienes servicios activos</option>}
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.plan?.name} - {s.address_text}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Categoría del Problema</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="RECLAMO">Reclamo o Avería</option>
                  <option value="COBERTURA_WIFI">Problemas de Cobertura Wi-Fi</option>
                  <option value="TRASLADO">Traslado de Domicilio</option>
                  <option value="MEJORA_PLAN">Mejorar mi Plan</option>
                  <option value="PAUSA_VACACIONES">Pausar por Vacaciones</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Asunto Breve</label>
                <input 
                  type="text"
                  placeholder="Ej: Internet muy lento desde ayer"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Descripción Detallada</label>
                <textarea 
                  rows={4}
                  placeholder="Por favor, describe tu problema o consulta con el mayor detalle posible..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#6366F1', color: 'white', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Enviar Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
