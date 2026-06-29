'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './services.module.css';
import Modal from '@/components/Modal';

interface Service {
  id: string;
  installation_date: string;
  status: string;
  ip_address: string;
  mac_address: string;
  customer: {
    full_name: string;
  };
  plan: {
    name: string;
    price: string;
  };
}

interface Customer {
  id: string;
  full_name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    plan_id: '',
    address_text: '',
    status: 'pending',
    billing_day: 1,
    monthly_amount: 0,
    ip_address: '',
    mac_address: '',
  });

  useEffect(() => {
    fetchServices();
    fetchCustomersAndPlans();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndPlans = async () => {
    try {
      const [custRes, planRes] = await Promise.all([
        api.get('/customers'),
        api.get('/plans')
      ]);
      setCustomers(custRes.data);
      setPlans(planRes.data);
      
      // Select defaults if arrays not empty
      if (custRes.data.length > 0 && planRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          customer_id: custRes.data[0].id,
          plan_id: planRes.data[0].id,
          monthly_amount: planRes.data[0].price
        }));
      }
    } catch (error) {
      console.error('Error fetching data for form:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'plan_id') {
      const selectedPlan = plans.find(p => p.id === value);
      if (selectedPlan) {
        setFormData({ ...formData, plan_id: value, monthly_amount: selectedPlan.price });
        return;
      }
    }

    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    });
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      customer_id: customers.length > 0 ? customers[0].id : '',
      plan_id: plans.length > 0 ? plans[0].id : '',
      address_text: '',
      status: 'pending',
      billing_day: 1,
      monthly_amount: plans.length > 0 ? plans[0].price : 0,
      ip_address: '',
      mac_address: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setIsEditing(true);
    setEditingId(service.id);
    setFormData({ 
      // Si el servicio no tiene customer.id en el DTO recibido, pero tenemos la tabla, podemos no editar el customer/plan si no se traen completos, o buscarlo si es necesario.
      // Aquí el DTO de UpdateServiceDto permite cosas opcionales, enviaremos lo que se edite.
      customer_id: '', // Not normally edited
      plan_id: '',     // Not normally edited
      address_text: (service as any).address_text || '',
      status: service.status || 'pending',
      billing_day: (service as any).billing_day || 1,
      monthly_amount: (service as any).monthly_amount || 0,
      ip_address: service.ip_address || '',
      mac_address: service.mac_address || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing && editingId) {
        // 🚀 SOLUCIÓN EN LA EDICIÓN: Armamos los datos básicos
        const updateData: any = {
          address_text: formData.address_text,
          status: formData.status,
          billing_day: formData.billing_day,
          monthly_amount: formData.monthly_amount,
        };

        // Solo incluimos la IP si el técnico escribió algo real en la caja de texto
        if (formData.ip_address && formData.ip_address.trim() !== '') {
          updateData.ip_address = formData.ip_address;
        }

        // Solo incluimos la MAC si el técnico escribió algo real en la caja de texto
        if (formData.mac_address && formData.mac_address.trim() !== '') {
          updateData.mac_address = formData.mac_address;
        }

        await api.patch(`/services/${editingId}`, updateData);
      } else {
        // Creación limpia (Ya corregida antes)
        const { ip_address, mac_address, ...creationData } = formData;
        await api.post('/services', creationData);
      }
      await fetchServices();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || (isEditing ? 'Error al actualizar el servicio.' : 'Error al crear el servicio.'));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este servicio?')) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Error al cancelar el servicio');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return <span className={`${styles.badge} ${styles.statusActive}`}>Activo</span>;
      case 'pending':
        return <span className={`${styles.badge} ${styles.statusSuspended}`} style={{ background: '#ffa940', color: '#fff' }}>Pendiente</span>;
      case 'suspended':
        return <span className={`${styles.badge} ${styles.statusSuspended}`}>Suspendido</span>;
      case 'cancelled':
        return <span className={`${styles.badge} ${styles.statusCancelled}`}>Cancelado</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Servicios e Instalaciones</h1>
        <button className={styles.addButton} onClick={handleOpenCreateModal}>
          <Plus size={20} />
          Nueva Instalación
        </button>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando servicios...</div>
        ) : services.length === 0 ? (
          <div className={styles.empty}>No hay servicios registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Plan</th>
                <th className={styles.th}>IP Asignada</th>
                <th className={styles.th}>Fecha Instalación</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{s.customer?.full_name || 'N/A'}</td>
                  <td className={styles.td}>{s.plan?.name} (S/ {s.plan?.price})</td>
                  <td className={styles.td}>{s.ip_address || 'Pendiente'}</td>
                  <td className={styles.td}>{s.installation_date ? new Date(s.installation_date).toLocaleDateString() : 'N/A'}</td>
                  <td className={styles.td}>{getStatusBadge(s.status)}</td>
                  <td className={styles.td}>
                    <button onClick={() => handleOpenEditModal(s)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem', fontWeight: 500 }} title="Editar">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo/Editar Servicio */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Instalación" : "Nueva Instalación"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isEditing && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Cliente</label>
                <select name="customer_id" value={formData.customer_id} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Plan de Internet</label>
                <select name="plan_id" value={formData.plan_id} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - S/{p.price}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Dirección de Instalación</label>
            <input type="text" name="address_text" value={formData.address_text} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Día de Facturación (1-31)</label>
              <input type="number" name="billing_day" value={formData.billing_day} onChange={handleInputChange} required min="1" max="31" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Monto Mensual (S/)</label>
              <input type="number" name="monthly_amount" value={formData.monthly_amount} onChange={handleInputChange} required min="0" step="0.1" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Dirección IP Asignada</label>
                <input type="text" name="ip_address" value={formData.ip_address} onChange={handleInputChange} placeholder="Ej. 192.168.1.100" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Dirección MAC</label>
                <input type="text" name="mac_address" value={formData.mac_address} onChange={handleInputChange} placeholder="Ej. 00:1B:44:11:3A:B7" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Estado</label>
            <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
              <option value="pending">Pendiente</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Instalación')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
