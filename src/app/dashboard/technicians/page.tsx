'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './technicians.module.css';
import Modal from '@/components/Modal';

interface Technician {
  id: string;
  full_name: string;
  email: string;
  status: string;
  phone?: string;
  document_number?: string;
  specialization?: string;
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    document_number: '',
    specialization: ''
  });

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/technician');
      setTechnicians(res.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/technician', formData);
      await fetchTechnicians();
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', password: '', phone: '', document_number: '', specialization: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el técnico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este técnico?')) return;
    try {
      await api.delete(`/technician/${id}`);
      fetchTechnicians();
    } catch (err) {
      console.error('Error deleting technician:', err);
      alert('Error al eliminar el técnico');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Técnicos</h1>
        <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Nuevo Técnico
        </button>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando técnicos...</div>
        ) : technicians.length === 0 ? (
          <div className={styles.empty}>No hay técnicos registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Especialización</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((t) => (
                <tr key={t.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{t.full_name || 'N/A'}</td>
                  <td className={styles.td}>{t.email || 'N/A'}</td>
                  <td className={styles.td}>{t.specialization || 'N/A'}</td>
                  <td className={styles.td}>{t.phone || 'N/A'}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${t.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                      {t.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Técnico */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Técnico">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Nombre Completo</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Contraseña Provisional</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Teléfono</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Documento (DNI/CE)</label>
              <input type="text" name="document_number" value={formData.document_number} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Especialización</label>
            <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="Ej. Instalación Fibra Óptica, Mantenimiento..." style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
          </div>

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : 'Crear Técnico'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
