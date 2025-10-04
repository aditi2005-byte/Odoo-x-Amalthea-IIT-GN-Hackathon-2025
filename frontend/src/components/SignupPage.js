import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';

const SignupPage = ({ onSwitchToLogin, onLogin }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        countryCurrency: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: ''
    });
    const [countries, setCountries] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
                const countryData = await response.json();
                const formattedCountries = countryData
                    .map(country => ({
                        name: country.name.common,
                        currency: Object.keys(country.currencies || {})[0] || 'USD'
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setCountries(formattedCountries);
            } catch (err) {
                console.error("Failed to fetch countries", err);
                setCountries([
                    { name: 'United States', currency: 'USD' },
                    { name: 'United Kingdom', currency: 'GBP' },
                    { name: 'European Union', currency: 'EUR' },
                    { name: 'India', currency: 'INR' }
                ]);
            }
        };
        fetchCountries();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.adminPassword !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (formData.adminPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            const { data } = await authAPI.signup(formData);
            // Auto-login after successful signup
            const loginResponse = await authAPI.login({
                email: formData.adminEmail,
                password: formData.adminPassword
            });
            onLogin(loginResponse.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card auth-card">
                <div className="auth-header">
                    <h2>Create Your Company</h2>
                    <p className="auth-subtitle">Get started with ExpenseFlow in minutes</p>
                </div>
                
                {error && (
                    <div className="error-message">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="companyName" className="form-label">Company Name</label>
                        <input 
                            id="companyName"
                            name="companyName"
                            type="text" 
                            value={formData.companyName} 
                            onChange={handleChange} 
                            className="form-input" 
                            placeholder="Enter your company name"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="countryCurrency" className="form-label">Country & Currency</label>
                        <select 
                            id="countryCurrency"
                            name="countryCurrency" 
                            value={formData.countryCurrency} 
                            onChange={handleChange} 
                            className="form-select" 
                            required
                        >
                            <option value="">Select your country...</option>
                            {countries.map(country => (
                                <option key={country.name} value={country.name}>
                                    {country.name} ({country.currency})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="adminName" className="form-label">Your Name</label>
                        <input 
                            id="adminName"
                            name="adminName"
                            type="text" 
                            value={formData.adminName} 
                            onChange={handleChange} 
                            className="form-input" 
                            placeholder="Enter your full name"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="adminEmail" className="form-label">Email Address</label>
                        <input 
                            id="adminEmail"
                            name="adminEmail"
                            type="email" 
                            value={formData.adminEmail} 
                            onChange={handleChange} 
                            className="form-input" 
                            placeholder="Enter your email"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="adminPassword" className="form-label">Password</label>
                        <input 
                            id="adminPassword"
                            name="adminPassword"
                            type="password" 
                            value={formData.adminPassword} 
                            onChange={handleChange} 
                            className="form-input" 
                            placeholder="Create a password (min. 6 characters)"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input 
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            className="form-input" 
                            placeholder="Confirm your password"
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
                                Creating Account...
                            </>
                        ) : (
                            'Create Company Account'
                        )}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <span onClick={onSwitchToLogin} className="auth-link">
                            Sign in here
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;