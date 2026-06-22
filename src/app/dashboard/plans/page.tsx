'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './plans.module.css';
import Modal from '@/components/Modal';

interface Plan {
  id: string;
  name: string;
  price: number;
  speed_mbps: number;
  description?: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    speed_mbps: 0,
    description: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    });
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, speed_mbps: 0, description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: Plan) => {
    setIsEditing(true);
    setEditingId(plan.id);
    setFormData({ 
      name: plan.name, 
      price: plan.price, 
      speed_mbps: plan.speed_mbps, 
      description: plan.description || '' 
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
        await api.patch(`/plans/${editingId}`, formData);
      } else {
        await api.post('/plans', formData);
      }
      await fetchPlans();
      setIsModalOpen(false);
      setFormData({ name: '', price: 0, speed_mbps: 0, description: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || (isEditing ? 'Error al actualizar el plan.' : 'Error al crear el plan.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Error al eliminar el plan');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Planes de Internet</h1>
        <button className={styles.addButton} onClick={handleOpenCreateModal}>
          <Plus size={20} />
          Nuevo Plan
        </button>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>Cargando planes...</div>
        ) : plans.length === 0 ? (
          <div className={styles.empty}>No hay planes registrados.</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className={`${styles.planCard} glass-panel`} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleOpenEditModal(plan)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }} title="Editar">
                  Editar
                </button>
                <button onClick={() => handleDelete(plan.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                S/ {Number(plan.price).toFixed(2)} <span>/ mes</span>
              </div>
              
              <div className={styles.planDetails} style={{ marginTop: '1rem' }}>
                <div className={styles.planDetailRow}>
                  <span className={styles.planDetailLabel}>Velocidad</span>
                  <span className={styles.planDetailValue}>{plan.speed_mbps} Mbps</span>
                </div>
                {plan.description && (
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Descripción</span>
                    <span className={styles.planDetailValue}>{plan.description}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo/Editar Plan */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Plan" : "Nuevo Plan"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Nombre del Plan</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ej. Fibra 100 Mbps" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Precio (S/)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.1" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Velocidad (Mbps)</label>
            <input type="number" name="speed_mbps" value={formData.speed_mbps} onChange={handleInputChange} required min="1" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Opcional" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', minHeight: '80px' }} />
          </div>

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Plan')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
