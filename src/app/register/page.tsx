'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/signup-client', { 
        email, 
        password, 
        full_name: fullName 
      });
      
      // On successful registration, redirect to login
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la cuenta.');
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
          <h1 className={`${styles.title} heading-gradient`}>Crea tu Cuenta</h1>
          <p className={styles.subtitle}>Únete a Aeronet como cliente</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre Completo</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Juan Pérez"
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
            {loading ? 'Creando...' : 'Registrarse'}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Ya tienes una cuenta? <a href="/login" className={styles.link}>Inicia Sesión</a>
        </div>
      </div>
    </div>
  );
}
