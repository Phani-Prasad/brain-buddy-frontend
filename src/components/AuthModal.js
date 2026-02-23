import React, { useState } from 'react';
import './AuthModal.css';

const API_BASE = 'https://brain-buddy-backend-5vgr.onrender.com';

function AuthModal({ initialMode = 'login', onSuccess, onClose }) {
    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setError('');
    };

    const switchMode = (newMode) => {
        reset();
        setMode(newMode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
            const body = mode === 'register'
                ? { username, email, password }
                : { email, password };

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Something went wrong. Please try again.');
                return;
            }

            // Store token and user info
            localStorage.setItem('bb_token', data.token);
            localStorage.setItem('bb_user', JSON.stringify(data.user));

            onSuccess(data.user);
        } catch (err) {
            setError('Cannot connect to server. Please make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="auth-modal">
                {/* Close button */}
                <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

                {/* Header */}
                <div className="auth-header">
                    <div className="auth-brain-icon">🧠</div>
                    <h2 className="auth-title">Brain Buddy</h2>
                    <p className="auth-subtitle">
                        {mode === 'login' ? 'Welcome back! Ready to learn?' : 'Create your free account'}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        Log In
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus={mode === 'login'}
                        />
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <span className="auth-spinner" />
                        ) : (
                            mode === 'login' ? '🚀 Log In' : '✨ Create Account'
                        )}
                    </button>
                </form>

                {/* Footer link */}
                <p className="auth-footer">
                    {mode === 'login' ? (
                        <>Don't have an account? <button className="auth-link" onClick={() => switchMode('register')}>Sign Up</button></>
                    ) : (
                        <>Already have an account? <button className="auth-link" onClick={() => switchMode('login')}>Log In</button></>
                    )}
                </p>
            </div>
        </div>
    );
}

export default AuthModal;
