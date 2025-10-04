import React, { useState, useEffect } from 'react';
import AdminApprovalRules from './AdminApprovalRules';
import UserManagement from './UserManagement';
import { expenseAPI, userAPI } from '../api';

const AdminDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalExpenses: 0,
        pendingExpenses: 0,
        approvedExpenses: 0,
        totalUsers: 0,
        totalAmount: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [expensesRes, usersRes] = await Promise.all([
                    expenseAPI.getUserExpenses(), // This would need to be updated to get all expenses
                    userAPI.getUsers({ company_id: user.company_id })
                ]);
                
                setExpenses(expensesRes.data || []);
                setUsers(usersRes.data);
                
                // Calculate stats
                const totalExpenses = expensesRes.data?.length || 0;
                const pendingExpenses = expensesRes.data?.filter(e => e.status === 'Submitted').length || 0;
                const approvedExpenses = expensesRes.data?.filter(e => e.status === 'Approved').length || 0;
                const totalAmount = expensesRes.data?.reduce((sum, expense) => sum + (expense.converted_amount || expense.amount), 0) || 0;
                
                setStats({
                    totalExpenses,
                    pendingExpenses,
                    approvedExpenses,
                    totalUsers: usersRes.data.length,
                    totalAmount
                });
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        
        fetchData();
    }, [user.company_id]);

    const OverviewTab = () => (
        <div className="grid grid-cols-1 gap-6">
            <div className="stats-grid grid-cols-4">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalExpenses}</div>
                    <div className="stat-label">Total Expenses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingExpenses}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.base_currency} {stats.totalAmount.toFixed(2)}</div>
                    <div className="stat-label">Total Amount</div>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Recent Expense Activity</h3>
                <div className="activity-list">
                    {expenses.slice(0, 5).map(expense => (
                        <div key={expense.id} className="activity-item">
                            <div className="activity-content">
                                <strong>{expense.submitter_name}</strong> submitted 
                                <strong> {expense.currency} {expense.amount}</strong> for {expense.description}
                            </div>
                            <div className="activity-meta">
                                <span className={`status-badge status-${expense.status.toLowerCase()}`}>
                                    {expense.status}
                                </span>
                                <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && (
                        <div className="empty-state">
                            <p>No expense activity yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const SystemTab = () => (
        <div className="card">
            <h3 className="card-title">System Configuration</h3>
            <div className="system-info">
                <div className="info-item">
                    <label>Company:</label>
                    <span>{user.company_name}</span>
                </div>
                <div className="info-item">
                    <label>Base Currency:</label>
                    <span>{user.base_currency}</span>
                </div>
                <div className="info-item">
                    <label>Total Users:</label>
                    <span>{users.length} users</span>
                </div>
                <div className="info-item">
                    <label>System Status:</label>
                    <span className="status-badge status-approved">Active</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard fade-in">
            <div className="dashboard-header">
                <div className="header-content">
                    <h2 className="dashboard-title">Admin Dashboard</h2>
                    <p className="dashboard-subtitle">Manage your organization's expense system</p>
                </div>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'approval-rules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approval-rules')}
                >
                    ⚙️ Approval Rules
                </button>
                <button
                    className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                >
                    🔧 System
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'users' && <UserManagement user={user} />}
                {activeTab === 'approval-rules' && <AdminApprovalRules user={user} />}
                {activeTab === 'system' && <SystemTab />}
            </div>
        </div>
    );
};

export default AdminDashboard;