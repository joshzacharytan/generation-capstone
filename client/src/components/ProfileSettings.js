import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProfileSettings = () => {
    const [activeSection, setActiveSection] = useState('password');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { logout } = useAuth();

    const passwordForm = useForm();
    const emailForm = useForm();

    const handlePasswordUpdate = async (data) => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            await profileAPI.updatePassword(data.oldPassword, data.newPassword);
            setMessage('Password updated successfully!');
            passwordForm.reset();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailUpdate = async (data) => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            await profileAPI.updateEmail(data.newEmail);
            setMessage('Email updated successfully!');
            emailForm.reset();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update email');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone.'
        );

        if (confirmed) {
            const doubleConfirmed = window.confirm(
                'This will permanently delete your account and all associated data. Are you absolutely sure?'
            );

            if (doubleConfirmed) {
                try {
                    setLoading(true);
                    await profileAPI.deleteAccount();
                    alert('Account deleted successfully');
                    logout();
                } catch (err) {
                    setError(err.response?.data?.detail || 'Failed to delete account');
                    setLoading(false);
                }
            }
        }
    };

    const sections = [
        { id: 'password', label: 'Change Password', icon: '🔒' },
        { id: 'email', label: 'Change Email', icon: '📧' },
        { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
    ];

    return (
        <div style={{ maxWidth: '800px' }}>
            {/* Section Navigation */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }}>
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => {
                            setActiveSection(section.id);
                            setMessage('');
                            setError('');
                        }}
                        style={{
                            padding: '0.75rem 1rem',
                            border: '1px solid #dee2e6',
                            backgroundColor: activeSection === section.id ? '#007bff' : 'white',
                            color: activeSection === section.id ? 'white' : '#333',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Messages */}
            {message && (
                <div style={{
                    color: '#155724',
                    backgroundColor: '#d4edda',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    border: '1px solid #c3e6cb'
                }}>
                    {message}
                </div>
            )}

            {error && (
                <div style={{
                    color: '#721c24',
                    backgroundColor: '#f8d7da',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    border: '1px solid #f5c6cb'
                }}>
                    {error}
                </div>
            )}

            {/* Change Password Section */}
            {activeSection === 'password' && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                {...passwordForm.register('oldPassword', { required: 'Current password is required' })}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                            {passwordForm.formState.errors.oldPassword && (
                                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                                    {passwordForm.formState.errors.oldPassword.message}
                                </span>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                {...passwordForm.register('newPassword', {
                                    required: 'New password is required',
                                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                })}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                            {passwordForm.formState.errors.newPassword && (
                                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                                    {passwordForm.formState.errors.newPassword.message}
                                </span>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                {...passwordForm.register('confirmPassword', {
                                    required: 'Please confirm your new password',
                                    validate: (value) => {
                                        const newPassword = passwordForm.getValues('newPassword');
                                        return value === newPassword || 'Passwords do not match';
                                    }
                                })}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                                    {passwordForm.formState.errors.confirmPassword.message}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: loading ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading && <LoadingSpinner size={20} />}
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            )}

            {/* Change Email Section */}
            {activeSection === 'email' && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Change Email</h3>
                    <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                New Email Address
                            </label>
                            <input
                                type="email"
                                {...emailForm.register('newEmail', { required: 'Email is required' })}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                                placeholder="Enter new email address"
                            />
                            {emailForm.formState.errors.newEmail && (
                                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                                    {emailForm.formState.errors.newEmail.message}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: loading ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading && <LoadingSpinner size={20} />}
                            {loading ? 'Updating...' : 'Update Email'}
                        </button>
                    </form>
                </div>
            )}

            {/* Danger Zone Section */}
            {activeSection === 'danger' && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #dc3545'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: '#dc3545' }}>Danger Zone</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: loading ? '#6c757d' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && <LoadingSpinner size={20} />}
                        {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;