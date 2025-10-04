import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [showSignup, setShowSignup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is stored in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const renderAuthenticatedApp = () => {
        switch (user.role) {
            case 'Employee':
                return <EmployeeDashboard user={user} />;
            case 'Manager':
                return <ManagerDashboard user={user} />;
            case 'Admin':
                return <AdminDashboard user={user} />;
            default:
                handleLogout();
                return null;
        }
    };

    const renderUnauthenticatedApp = () => {
        return showSignup ? (
            <SignupPage onSwitchToLogin={() => setShowSignup(false)} onLogin={handleLogin} />
        ) : (
            <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">💰 ExpenseFlow Pro</h1>
                    {user && (
                        <div className="user-info">
                            <span className="welcome-text">
                                Welcome, <strong>{user.name}</strong> 
                                <span className="user-role">({user.role})</span>
                            </span>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>
            <main className="app-main">
                {user ? renderAuthenticatedApp() : renderUnauthenticatedApp()}
            </main>
        </div>
    );
}

export default App;