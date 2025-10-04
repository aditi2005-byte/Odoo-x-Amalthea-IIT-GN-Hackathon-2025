import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseHistory from './ExpenseHistory';
import { expenseAPI, debugAPI } from '../api';

const EmployeeDashboard = ({ user }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [submitting, setSubmitting] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    const fetchExpenses = async () => {
        try {
            console.log('🔄 Fetching expenses for user:', user.id);
            const { data } = await expenseAPI.getUserExpenses(user.id);
            console.log('📋 Expenses fetched:', data);
            setExpenses(data);
            
            // Debug: Check if there are any draft expenses
            const draftExpenses = data.filter(exp => exp.status === 'Draft');
            console.log('📝 Draft expenses found:', draftExpenses.length);
            
        } catch (error) {
            console.error('❌ Failed to fetch expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debug function to check all expenses
    const debugAllExpenses = async () => {
        try {
            const { data } = await debugAPI.getAllExpenses();
            console.log('🐛 All expenses in database:', data);
            setDebugInfo(`Debug: ${data.length} total expenses in system`);
        } catch (error) {
            console.error('Debug error:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
        debugAllExpenses(); // Initial debug info
    }, [user.id]);

    const getExpensesByStatus = (status) => {
        if (status === 'all') return expenses;
        return expenses.filter(expense => expense.status === status);
    };

    const getTotalAmount = (expensesList) => {
        return expensesList.reduce((total, expense) => total + (expense.converted_amount || expense.amount), 0);
    };

    const statusConfig = {
        'all': { title: 'All Expenses', color: 'bg-gray-100 text-gray-800', totalColor: 'text-gray-600' },
        'Draft': { title: 'To Submit', color: 'bg-yellow-100 text-yellow-800', totalColor: 'text-yellow-600' },
        'Submitted': { title: 'Waiting Approval', color: 'bg-blue-100 text-blue-800', totalColor: 'text-blue-600' },
        'Approved': { title: 'Approved', color: 'bg-green-100 text-green-800', totalColor: 'text-green-600' },
        'Rejected': { title: 'Rejected', color: 'bg-red-100 text-red-800', totalColor: 'text-red-600' }
    };

    const handleSubmitExpense = async (expenseId) => {
        setSubmitting(expenseId);
        setDebugInfo(`Submitting expense ${expenseId}...`);
        
        try {
            console.log('🔄 Submitting draft expense:', expenseId);
            const response = await expenseAPI.submitExpense(expenseId);
            console.log('✅ Draft submitted successfully:', response.data);
            
            setDebugInfo(`✅ Success! Expense ${expenseId} submitted.`);
            
            // Show success message
            alert('Expense submitted for approval successfully!');
            
            // Refresh the expenses list to show updated status
            await fetchExpenses();
            
            // Also refresh debug info
            await debugAllExpenses();
            
        } catch (error) {
            console.error('❌ Failed to submit expense:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to submit expense. Please try again.';
            setDebugInfo(`❌ Error: ${errorMessage}`);
            alert(`Error: ${errorMessage}`);
        } finally {
            setSubmitting(null);
        }
    };

    const ExpenseCard = ({ expense }) => (
        <div className="card expense-card" onClick={() => setSelectedExpense(expense)}>
            <div className="expense-header">
                <h4 className="expense-description">{expense.description}</h4>
                <span className={`status-badge status-${expense.status.toLowerCase()}`}>
                    {expense.status}
                </span>
            </div>
            <div className="expense-details">
                <div className="expense-amount">
                    {expense.currency} {expense.amount.toFixed(2)}
                    {expense.converted_amount && expense.currency !== expense.base_currency && (
                        <span className="converted-amount">
                            ≈ {expense.base_currency} {expense.converted_amount.toFixed(2)}
                        </span>
                    )}
                </div>
                <div className="expense-meta">
                    <span>{expense.category}</span>
                    <span>•</span>
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="expense-id">ID: {expense.id}</span>
                </div>
            </div>
            {expense.status === 'Draft' && (
                <div className="expense-actions">
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSubmitExpense(expense.id);
                        }}
                        disabled={submitting === expense.id}
                    >
                        {submitting === expense.id ? (
                            <>
                                <div className="loading-spinner small"></div>
                                Submitting...
                            </>
                        ) : (
                            'Submit for Approval'
                        )}
                    </button>
                    <button 
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit expense:', expense.id);
                        }}
                    >
                        Edit
                    </button>
                </div>
            )}
        </div>
    );

    const StatusColumn = ({ status, expenses }) => (
        <div className="card status-column">
            <div className="column-header">
                <h3 className="column-title">{statusConfig[status]?.title || status}</h3>
                <div className={`column-total ${statusConfig[status]?.totalColor}`}>
                    {user.base_currency} {getTotalAmount(expenses).toFixed(2)}
                </div>
            </div>
            <div className="expenses-list">
                {expenses.map(expense => (
                    <ExpenseCard key={expense.id} expense={expense} />
                ))}
                {expenses.length === 0 && (
                    <div className="empty-state">
                        <p>No {status.toLowerCase()} expenses</p>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading your expenses...</p>
            </div>
        );
    }

    return (
        <div className="employee-dashboard fade-in">
            {isFormOpen && (
                <ExpenseForm 
                    user={user} 
                    onClose={() => {
                        setIsFormOpen(false);
                        fetchExpenses();
                        debugAllExpenses();
                    }} 
                />
            )}
            
            {selectedExpense && (
                <ExpenseHistory
                    expense={selectedExpense}
                    user={user}
                    onClose={() => setSelectedExpense(null)}
                />
            )}
            
            <div className="dashboard-header">
                <div className="header-content">
                    <h2 className="dashboard-title">My Expenses</h2>
                    <p className="dashboard-subtitle">Manage and track your expense claims</p>
                    {debugInfo && (
                        <div className="debug-info">
                            <small>{debugInfo}</small>
                            <button 
                                className="btn btn-sm btn-outline ml-2"
                                onClick={debugAllExpenses}
                            >
                                Refresh Debug
                            </button>
                        </div>
                    )}
                </div>
                <div className="header-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsFormOpen(true)}
                    >
                        + New Expense
                    </button>
                </div>
            </div>

            <div className="stats-grid mb-6">
                <div className="stat-card">
                    <div className="stat-value">{expenses.length}</div>
                    <div className="stat-label">Total Expenses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{getExpensesByStatus('Draft').length}</div>
                    <div className="stat-label">To Submit</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{getExpensesByStatus('Submitted').length}</div>
                    <div className="stat-label">In Review</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{getExpensesByStatus('Approved').length}</div>
                    <div className="stat-label">Approved</div>
                </div>
            </div>

            <div className="tab-navigation">
                {Object.keys(statusConfig).map(status => (
                    <button
                        key={status}
                        className={`tab-btn ${activeTab === status ? 'active' : ''}`}
                        onClick={() => setActiveTab(status)}
                    >
                        {statusConfig[status].title}
                        <span className="tab-count">{getExpensesByStatus(status).length}</span>
                    </button>
                ))}
            </div>

            <div className="tab-content">
                <StatusColumn status={activeTab} expenses={getExpensesByStatus(activeTab)} />
            </div>
        </div>
    );
};

export default EmployeeDashboard;