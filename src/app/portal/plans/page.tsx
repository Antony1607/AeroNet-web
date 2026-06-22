'use client';

import { useEffect, useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import styles from '../portal.module.css';
import { api } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  speed_mbps: number;
  description: string;
}

export default function PortalPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !address || !fullName || !documentNumber || !phone) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/services/with-ticket', {
        plan_id: selectedPlan,
        address_text: address,
        full_name: fullName,
        document_type: documentType,
        document_number: documentNumber,
        phone: phone,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando planes...</div>;
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Nuestros Planes</h1>
        <p className={styles.pageSubtitle}>Elige un nuevo plan para solicitar una instalación adicional.</p>
      </div>

      {success ? (
        <div className={styles.successCard}>
          <CheckCircle size={80} style={{ color: '#10B981', margin: '0 auto 1.5rem' }} />
          <h2 className={styles.pageTitle} style={{ fontSize: '2rem' }}>¡Solicitud enviada con éxito!</h2>
          <p className={styles.pageSubtitle} style={{ marginTop: '1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
            Hemos recibido tu nueva solicitud de instalación. Un técnico se contactará contigo a la brevedad para coordinar la visita.
          </p>
        </div>
      ) : (
        <div>
          <div className={styles.planGrid}>
            {plans.map(p => (
              <div 
                key={p.id} 
                className={`${styles.planCard} ${selectedPlan === p.id ? styles.planCardSelected : ''}`}
                onClick={() => setSelectedPlan(p.id)}
              >
                <div className={styles.planIcon}>
                  <Package size={32} />
                </div>
                <h3 className={styles.planName}>{p.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.planCurrency}>S/</span>
                  {p.price}
                  <span className={styles.planPeriod}>/mes</span>
                </div>
                <p className={styles.planDesc}>{p.description || `Velocidad de ${p.speed_mbps} Mbps`}</p>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className={styles.formCard}>
              <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: '#1E1B4B' }}>Completa tus datos para la instalación</h2>
              <form onSubmit={handleRequestService}>
                <div className={styles.inputGroup}>
                  <label>Nombre Completo / Razón Social</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    className={styles.input}
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Ej. Juan Pérez" 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label>Documento</label>
                    <select 
                      value={documentType}
                      className={styles.input}
                      onChange={(e) => setDocumentType(e.target.value)}
                      required
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label>Número</label>
                    <input 
                      type="text" 
                      value={documentNumber} 
                      className={styles.input}
                      onChange={(e) => setDocumentNumber(e.target.value)} 
                      placeholder="Número de documento" 
                      required 
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Teléfono Celular</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    className={styles.input}
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Ej. 987654321" 
                    required 
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Dirección exacta de instalación</label>
                  <input 
                    type="text" 
                    value={address} 
                    className={styles.input}
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Ej. Av. Los Cedros 123, Distrito" 
                    required 
                  />
                </div>
                
                {error && <div style={{ color: '#EF4444', marginBottom: '1.5rem', fontWeight: 500 }}>{error}</div>}

                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Solicitar Instalación Ahora'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
