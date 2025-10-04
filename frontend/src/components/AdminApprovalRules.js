import React, { useState, useEffect } from 'react';
import { approvalAPI, userAPI } from '../api';

const AdminApprovalRules = ({ user }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [approvers, setApprovers] = useState([{ id: '', sequence: 1 }]);
    const [ruleSettings, setRuleSettings] = useState({
        name: '',
        is_sequential: false,
        min_approval_percentage: 100
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await userAPI.getUsers({ company_id: user.company_id });
                setAllUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, [user.company_id]);

    const handleAddApprover = () => {
        setApprovers([...approvers, { id: '', sequence: approvers.length + 1 }]);
    };

    const handleRemoveApprover = (index) => {
        if (approvers.length > 1) {
            const newApprovers = approvers.filter((_, i) => i !== index);
            setApprovers(newApprovers.map((app, idx) => ({ ...app, sequence: idx + 1 })));
        }
    };

    const handleApproverChange = (index, field, value) => {
        const newApprovers = [...approvers];
        newApprovers[index] = { ...newApprovers[index], [field]: value };
        setApprovers(newApprovers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedUser) {
            setMessage('Please select a user for this rule');
            return;
        }

        if (approvers.some(app => !app.id)) {
            setMessage('Please select all approvers');
            return;
        }

        setLoading(true);
        try {
            await approvalAPI.createRule({
                name: ruleSettings.name || `Rule for ${allUsers.find(u => u.id == selectedUser)?.name}`,
                applies_to_user_id: parseInt(selectedUser),
                is_sequential: ruleSettings.is_sequential,
                min_approval_percentage: ruleSettings.min_approval_percentage,
                approvers: approvers.map(app => ({ id: parseInt(app.id) }))
            });
            
            setMessage('✅ Approval rule created successfully!');
            // Reset form
            setSelectedUser('');
            setApprovers([{ id: '', sequence: 1 }]);
            setRuleSettings({
                name: '',
                is_sequential: false,
                min_approval_percentage: 100
            });
        } catch (error) {
            setMessage('❌ Failed to create approval rule. Please try again.');
            console.error('Failed to create rule:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEmployeeOptions = () => {
        return allUsers.filter(u => u.role === 'Employee');
    };

    const getManagerOptions = () => {
        return allUsers.filter(u => u.role === 'Manager' || u.role === 'Admin');
    };

    return (
        <div className="approval-rules fade-in">
            <div className="card">
                <h2 className="card-title">Approval Rules Configuration</h2>
                <p className="card-subtitle">Define custom approval workflows for your team members</p>
                
                {message && (
                    <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3 className="section-title">Rule Application</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">This rule applies to:</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select an employee</option>
                                    {getEmployeeOptions().map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Rule Name</label>
                                <input
                                    type="text"
                                    value={ruleSettings.name}
                                    onChange={(e) => setRuleSettings(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }))}
                                    className="form-input"
                                    placeholder="e.g., Standard Expense Approval"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title">Approval Workflow</h3>
                        
                        <div className="approvers-list">
                            <label className="form-label">Approvers (in order):</label>
                            {approvers.map((approver, index) => (
                                <div key={index} className="approver-row">
                                    <span className="sequence-number">{index + 1}</span>
                                    <select
                                        value={approver.id}
                                        onChange={(e) => handleApproverChange(index, 'id', e.target.value)}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select approver</option>
                                        {getManagerOptions().map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                    {approvers.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveApprover(index)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleAddApprover}
                            >
                                + Add Another Approver
                            </button>
                        </div>
                        
                        <div className="settings-grid">
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={ruleSettings.is_sequential}
                                        onChange={(e) => setRuleSettings(prev => ({
                                            ...prev,
                                            is_sequential: e.target.checked
                                        }))}
                                    />
                                    <span className="checkmark"></span>
                                    Approvers must approve in sequence
                                </label>
                                <div className="checkbox-help">
                                    If checked, approvers will receive the request one by one in order
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Minimum Approval Percentage</label>
                                <div className="percentage-input">
                                    <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        step="10"
                                        value={ruleSettings.min_approval_percentage}
                                        onChange={(e) => setRuleSettings(prev => ({
                                            ...prev,
                                            min_approval_percentage: parseInt(e.target.value)
                                        }))}
                                        className="percentage-slider"
                                    />
                                    <span className="percentage-value">
                                        {ruleSettings.min_approval_percentage}%
                                    </span>
                                </div>
                                <div className="percentage-help">
                                    {ruleSettings.min_approval_percentage === 100 ? 
                                        'All approvers must approve' :
                                        `${ruleSettings.min_approval_percentage}% of approvers must approve`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating Rule...' : 'Create Approval Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminApprovalRules;