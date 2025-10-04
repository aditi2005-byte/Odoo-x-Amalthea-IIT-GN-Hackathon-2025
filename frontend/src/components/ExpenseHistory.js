import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../api';

const ExpenseHistory = ({ expense, user, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await expenseAPI.getExpenseHistory(expense.id);
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [expense.id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-green-600';
            case 'Rejected': return 'text-red-600';
            case 'Submitted': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Expense Details & History</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="expense-details mb-6">
                    <h4 className="text-lg font-semibold mb-2">{expense.description}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Amount:</strong> {expense.currency} {expense.amount.toFixed(2)}
                        </div>
                        <div>
                            <strong>Status:</strong> 
                            <span className={`ml-1 ${getStatusColor(expense.status)}`}>
                                {expense.status}
                            </span>
                        </div>
                        <div>
                            <strong>Category:</strong> {expense.category}
                        </div>
                        <div>
                            <strong>Date:</strong> {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                        {expense.converted_amount && expense.currency !== user.base_currency && (
                            <div className="col-span-2">
                                <strong>Converted Amount:</strong> {user.base_currency} {expense.converted_amount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="history-section">
                    <h4 className="section-title mb-4">Approval History</h4>
                    
                    {loading ? (
                        <div className="loading-spinner"></div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">
                            <p>No approval history yet</p>
                        </div>
                    ) : (
                        <div className="history-timeline">
                            {history.map((record, index) => (
                                <div key={record.id} className="history-item">
                                    <div className="timeline-marker"></div>
                                    <div className="history-content">
                                        <div className="history-header">
                                            <strong>{record.performed_by_name}</strong>
                                            <span className={`action-badge action-${record.action.toLowerCase()}`}>
                                                {record.action}
                                            </span>
                                        </div>
                                        <div className="history-date">
                                            {new Date(record.created_at).toLocaleString()}
                                        </div>
                                        {record.comments && (
                                            <div className="history-comments">
                                                "{record.comments}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseHistory;