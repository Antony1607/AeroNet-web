'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './signup.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/auth/signup-client', {
        full_name: fullName,
        email,
        password
      });
      
      setSuccess(true);
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar tu cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <h1 className={`${styles.title} heading-gradient`}>Únete a Aeronet</h1>
          <p className={styles.subtitle}>Crea tu cuenta de cliente</p>
        </div>

        {success ? (
          <div className={styles.success}>
            ¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSignup}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nombre Completo</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Ej. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Correo Electrónico</label>
              <input 
                type="email" 
                className={styles.input} 
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña</label>
              <input 
                type="password" 
                className={styles.input} 
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button 
              type="submit" 
              className={styles.button} 
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          ¿Ya tienes una cuenta? <a href="/login" className={styles.link}>Inicia Sesión</a>
        </div>
      </div>
    </div>
  );
}
