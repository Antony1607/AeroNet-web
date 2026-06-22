'use client';

import { useEffect, useState, useRef } from 'react';
import { User, Camera, Save, Phone, MapPin, Mail, CreditCard } from 'lucide-react';
import styles from '../portal.module.css';
import { api } from '@/lib/api';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  document_number: string;
  billing_document_type: string;
  avatar_url?: string;
}

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customers/me');
      setProfile(res.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // Prospecto sin perfil todavía
        setProfile(null);
      } else {
        console.error('Error fetching profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await api.patch(`/customers/${profile.id}`, {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        document_number: profile.document_number,
        billing_document_type: profile.billing_document_type
      });
      alert('Perfil actualizado con éxito');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(err.response?.data?.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/customers/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Foto de perfil actualizada con éxito');
      // Update local avatar URL
      if (profile && res.data.avatar_url) {
        setProfile({ ...profile, avatar_url: res.data.avatar_url });
      } else {
        fetchProfile(); // reload to get new avatar
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      alert(err.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando perfil...</div>;
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ display: 'inline-flex', padding: '2rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <User size={64} color="#6366F1" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#0F172A', marginBottom: '1rem' }}>Tu perfil aún no está completo</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '400px' }}>
            Para habilitar y editar todas las opciones de tu perfil, primero debes solicitar un plan de internet.
          </p>
          <a href="/portal/plans" style={{ 
            background: '#0F172A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', 
            textDecoration: 'none', fontWeight: 600, display: 'inline-block' 
          }}>
            Obtener mi primer servicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Perfil</h1>
        <p className={styles.pageSubtitle}>Administra tu información personal y configuración de facturación.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '800px' }}>
        {/* Avatar Section */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                width: '100px', height: '100px', borderRadius: '50%', background: '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.5rem', color: '#64748b', fontWeight: 600 }}>
                  {profile.full_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <button 
              onClick={handleAvatarClick}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                background: '#0F172A', color: 'white', border: 'none',
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: uploading ? 0.7 : 1
              }}
              title="Cambiar foto de perfil"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0F172A' }}>{profile.full_name}</h2>
            <p style={{ margin: 0, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> {profile.email}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form className={styles.card} onSubmit={handleSave}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} /> Datos Personales
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Nombre Completo</label>
              <input 
                type="text" 
                name="full_name"
                value={profile.full_name || ''} 
                onChange={handleInputChange}
                required
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14}/> Teléfono (WhatsApp)
              </label>
              <input 
                type="text" 
                name="phone"
                value={profile.phone || ''} 
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={14}/> Dirección de Facturación
              </label>
              <input 
                type="text" 
                name="address"
                value={profile.address || ''} 
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CreditCard size={14}/> Tipo de Comprobante
              </label>
              <select
                name="billing_document_type"
                value={profile.billing_document_type || 'BOLETA'}
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
              >
                <option value="BOLETA">Boleta</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                {profile.billing_document_type === 'FACTURA' ? 'RUC' : 'DNI / Carné de Ext.'}
              </label>
              <input 
                type="text" 
                name="document_number"
                value={profile.document_number || ''} 
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit"
              disabled={saving}
              style={{
                background: '#0F172A', color: 'white', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? (
                <>Guardando...</>
              ) : (
                <><Save size={18} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
