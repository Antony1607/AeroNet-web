'use client';

import { useEffect, useState } from 'react';
import { Plus, User, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './customers.module.css';
import Modal from '@/components/Modal';

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  document_type: string;
  document_number: string;
  phone: string;
  address: string;
  avatar_url: string;
  status: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '', // solo para creación
    phone: '',
    document_type: 'DNI',
    document_number: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ full_name: '', email: '', password: '', phone: '', document_type: 'DNI', document_number: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      full_name: c.full_name,
      email: c.email,
      password: '', // No editamos contraseña por aquí
      phone: c.phone || '',
      document_type: c.document_type || 'DNI',
      document_number: c.document_number || '',
      address: c.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        // Actualizar cliente
        await api.patch(`/customers/${editingId}`, {
          full_name: formData.full_name,
          phone: formData.phone,
          document_type: formData.document_type,
          document_number: formData.document_number,
          address: formData.address
        });
      } else {
        // 1. Crear usuario en Auth
        const authRes = await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          role_name: 'customer'
        });
        
        const userId = authRes.data.user_id;

        // 2. Crear perfil del cliente
        await api.post('/customers', {
          user_id: userId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          document_type: formData.document_type,
          document_number: formData.document_number,
          address: formData.address
        });
      }

      await fetchCustomers();
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', password: '', phone: '', document_type: 'DNI', document_number: '', address: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este cliente?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Error al eliminar el cliente');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`${styles.title} heading-gradient`}>Clientes</h1>
        <button className={styles.addButton} onClick={openNewModal}>
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className={`${styles.tableWrapper} glass-panel`}>
        {loading ? (
          <div className={styles.empty}>Cargando clientes...</div>
        ) : customers.length === 0 ? (
          <div className={styles.empty}>No hay clientes registrados.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Perfil</th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Documento</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className={styles.tr}>
                  <td className={styles.td}>
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.full_name || 'Avatar'} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} />
                      </div>
                    )}
                  </td>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{c.full_name || 'N/A'}</td>
                  <td className={styles.td}>{c.email || 'N/A'}</td>
                  <td className={styles.td}>{c.phone || 'N/A'}</td>
                  <td className={styles.td}>{c.document_type} {c.document_number}</td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(c)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger, #ff4d4f)', background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">
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

      {/* Modal Nuevo/Editar Cliente */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Cliente" : "Nuevo Cliente"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Nombre Completo</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Correo Electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingId} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', opacity: editingId ? 0.5 : 1 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!editingId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Contraseña Provisional</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: editingId ? '1 / -1' : 'auto' }}>
              <label>Teléfono</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Tipo Documento</label>
              <select name="document_type" value={formData.document_type} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Número Documento</label>
              <input type="text" name="document_number" value={formData.document_number} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)' }} />
          </div>

          {error && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
