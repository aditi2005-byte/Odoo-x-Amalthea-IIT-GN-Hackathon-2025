import React, { useState, useEffect } from 'react';
import { userAPI } from '../api';

const InviteUserModal = ({ onClose, onInvite }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Employee',
        manager_id: ''
    });
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const { data } = await userAPI.getManagers();
                setManagers(data);
            } catch (error) {
                console.error('Failed to fetch managers:', error);
            }
        };
        fetchManagers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await userAPI.createUser(formData);
            alert(`User created successfully! Generated password: ${data.generatedPassword}`);
            onInvite(formData);
            onClose();
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Failed to create user. Please try again.');
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

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Create New User</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter full name"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Role *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="form-select"
                            required
                        >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                    
                    {formData.role === 'Employee' && (
                        <div className="form-group">
                            <label className="form-label">Manager *</label>
                            <select
                                name="manager_id"
                                value={formData.manager_id}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select manager</option>
                                {managers.map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.name} ({manager.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating User...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const { data } = await userAPI.getUsers({ company_id: user.company_id });
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user.company_id]);

    const handleInviteUser = async (userData) => {
        await fetchUsers(); // Refresh the list
    };

    const getManagerName = (managerId) => {
        const manager = users.find(u => u.id === managerId);
        return manager ? manager.name : '-';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className="user-management">
            {isModalOpen && (
                <InviteUserModal 
                    onClose={() => setIsModalOpen(false)}
                    onInvite={handleInviteUser}
                />
            )}
            
            <div className="card">
                <div className="table-header">
                    <h3>User Management</h3>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Create User
                    </button>
                </div>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Manager</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.email}</td>
                                <td>{getManagerName(user.manager_id)}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button className="btn-text">Reset Password</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;