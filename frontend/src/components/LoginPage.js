import React, { useState } from 'react';
import { authAPI } from '../api';

const LoginPage = ({ onLogin, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        try {
            const { data } = await authAPI.login({ email, password });
            onLogin(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to your ExpenseFlow account</p>
                </div>
                
                {error && (
                    <div className="error-message">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="form-input" 
                            placeholder="Enter your email"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="form-input" 
                            placeholder="Enter your password"
                            required 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="loading-spinner small"></div>
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <span onClick={onSwitchToSignup} className="auth-link">
                            Create one here
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;