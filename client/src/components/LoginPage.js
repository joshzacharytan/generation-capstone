import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        tenantName: '',
        tenantDomain: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(
                    formData.email, 
                    formData.password, 
                    formData.tenantName,
                    formData.tenantDomain
                );
            }

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            email: '',
            password: '',
            tenantName: '',
            tenantDomain: ''
        });
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--bg-secondary)',
            position: 'relative'
        }}>
            
            <div style={{ 
                maxWidth: '400px', 
                width: '100%',
                padding: '2rem', 
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: '8px', 
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-primary)'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                    {isLogin ? 'Vendor Login' : 'Create Account'}
                </h2>
                
                {error && (
                    <div style={{ 
                        color: 'var(--color-danger)', 
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        border: '1px solid rgba(220, 53, 69, 0.3)'
                    }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Email:
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                transition: 'var(--theme-transition)'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Password:
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                border: '1px solid var(--input-border)',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                transition: 'var(--theme-transition)'
                            }}
                        />
                    </div>
                    
                    {!isLogin && (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    Company Name:
                                </label>
                                <input
                                    type="text"
                                    name="tenantName"
                                    value={formData.tenantName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., My Awesome Shop"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        border: '1px solid var(--input-border)',
                                        borderRadius: '4px',
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        transition: 'var(--theme-transition)'
                                    }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    Domain (optional):
                                </label>
                                <input
                                    type="text"
                                    name="tenantDomain"
                                    value={formData.tenantDomain}
                                    onChange={handleInputChange}
                                    placeholder="e.g., myshop.example.com"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        border: '1px solid var(--input-border)',
                                        borderRadius: '4px',
                                        fontSize: '1rem',
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--text-primary)',
                                        transition: 'var(--theme-transition)'
                                    }}
                                />
                            </div>
                        </>
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? 'var(--color-secondary)' : 'var(--color-primary)',
                            color: 'var(--text-inverse)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'var(--theme-transition)'
                        }}
                    >
                        {loading && <LoadingSpinner size={20} />}
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={toggleMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            transition: 'var(--theme-transition)'
                        }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;