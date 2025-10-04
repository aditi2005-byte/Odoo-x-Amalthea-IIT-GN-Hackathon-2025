import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, userAPI } from '../api';

const ExpenseApprovalModal = ({ expense, user, onClose, onAction }) => {
    const [action, setAction] = useState('');
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!action) return;
        
        setLoading(true);
        try {
            await onAction(expense.id, action, comments);
            onClose();
        } catch (error) {
            console.error('Failed to process expense:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Review Expense</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <div className="expense-details mb-6">
                    <h4 className="text-lg font-semibold mb-2">{expense.description}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Amount:</strong> {expense.currency} {expense.amount.toFixed(2)}
                        </div>
                        <div>
                            <strong>Converted:</strong> {user.base_currency} {expense.converted_amount?.toFixed(2) || expense.amount.toFixed(2)}
                        </div>
                        <div>
                            <strong>Category:</strong> {expense.category}
                        </div>
                        <div>
                            <strong>Submitted by:</strong> {expense.submitter_name}
                        </div>
                        <div>
                            <strong>Date:</strong> {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>Submitted:</strong> {new Date(expense.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Action</label>
                        <div className="action-buttons">
                            <button
                                type="button"
                                className={`btn ${action === 'Approved' ? 'btn-success' : 'btn-secondary'}`}
                                onClick={() => setAction('Approved')}
                            >
                                ✅ Approve
                            </button>
                            <button
                                type="button"
                                className={`btn ${action === 'Rejected' ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={() => setAction('Rejected')}
                            >
                                ❌ Reject
                            </button>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Comments (Optional)</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="form-textarea"
                            placeholder="Add comments for the submitter..."
                            rows="3"
                        />
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={!action || loading}
                        >
                            {loading ? 'Processing...' : `Submit ${action}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManagerDashboard = ({ user }) => {
    const [pendingExpenses, setPendingExpenses] = useState([]);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0
    });

    const fetchPendingExpenses = useCallback(async () => {
        try {
            const { data } = await expenseAPI.getPendingExpenses(user.id);
            setPendingExpenses(data);
            setStats(prev => ({
                ...prev,
                pending: data.length
            }));
        } catch (error) {
            console.error('Failed to fetch pending expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchPendingExpenses();
    }, [fetchPendingExpenses]);

    const handleExpenseAction = async (expenseId, action, comments) => {
        try {
            await expenseAPI.approveExpense(expenseId, {
                approverId: user.id,
                action,
                comments
            });
            fetchPendingExpenses(); // Refresh the list
        } catch (error) {
            console.error('Failed to process expense:', error);
            throw error;
        }
    };

    const openExpenseModal = (expense) => {
        setSelectedExpense(expense);
    };

    const PendingExpensesList = () => (
        <div className="card">
            <div className="table-header">
                <h3>Approvals Pending Review</h3>
                <div className="approval-count">
                    {pendingExpenses.length} expenses waiting
                </div>
            </div>
            
            {pendingExpenses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h4>All caught up!</h4>
                    <p>No expenses waiting for your approval.</p>
                </div>
            ) : (
                <div className="expenses-grid">
                    {pendingExpenses.map(expense => (
                        <div key={expense.id} className="expense-approval-card">
                            <div className="expense-info">
                                <h4>{expense.description}</h4>
                                <p className="expense-meta">
                                    {expense.submitter_name} • {expense.category}
                                </p>
                                <div className="expense-amounts">
                                    <span className="original-amount">
                                        {expense.currency} {expense.amount.toFixed(2)}
                                    </span>
                                    {expense.converted_amount && expense.currency !== user.base_currency && (
                                        <span className="converted-amount">
                                            → {user.base_currency} {expense.converted_amount.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <p className="expense-date">
                                    {new Date(expense.expense_date).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                className="btn btn-primary"
                                onClick={() => openExpenseModal(expense)}
                            >
                                Review
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading approvals...</p>
            </div>
        );
    }

    return (
        <div className="manager-dashboard fade-in">
            {selectedExpense && (
                <ExpenseApprovalModal
                    expense={selectedExpense}
                    user={user}
                    onClose={() => setSelectedExpense(null)}
                    onAction={handleExpenseAction}
                />
            )}
            
            <div className="dashboard-header">
                <div className="header-content">
                    <h2 className="dashboard-title">Manager Dashboard</h2>
                    <p className="dashboard-subtitle">Review and approve expense claims from your team</p>
                </div>
            </div>

            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending Review</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.approved}</div>
                    <div className="stat-label">Approved Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.rejected}</div>
                    <div className="stat-label">Rejected Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.base_currency}</div>
                    <div className="stat-label">Base Currency</div>
                </div>
            </div>

            <PendingExpensesList />
        </div>
    );
};

export default ManagerDashboard;