import React, { useState, useEffect } from 'react';
import { userAPI } from '../api';

const AdminUserManagement = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Employee',
        manager_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const { data } = await userAPI.getUsersByCompany(user.company_id);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Failed to load users');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user.company_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await userAPI.createUser({
                ...formData,
                company_id: user.company_id
            });
            
            setFormData({ name: '', email: '', role: 'Employee', manager_id: '' });
            setShowForm(false);
            await fetchUsers();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getManagerName = (managerId) => {
        const manager = users.find(u => u.id === managerId);
        return manager ? manager.name : '-';
    };

    const managers = users.filter(u => u.role === 'Manager');

    return (
        <div className="user-management">
            <div className="section-header">
                <h3>User Management</h3>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                >
                    + Add User
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Add New User</h4>
                            <button 
                                className="close-button"
                                onClick={() => setShowForm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>
                            {formData.role === 'Employee' && (
                                <div className="form-group">
                                    <label className="form-label">Manager</label>
                                    <select
                                        name="manager_id"
                                        value={formData.manager_id}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Manager</option>
                                        {managers.map(manager => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="loading-spinner small"></div>
                                    ) : (
                                        'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Manager</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info">
                                        <span className="user-name">{user.name}</span>
                                        {user.role === 'Admin' && (
                                            <span className="role-badge admin">Admin</span>
                                        )}
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{getManagerName(user.manager_id)}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="empty-state">
                        <p>No users found. Add your first user to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManagement;