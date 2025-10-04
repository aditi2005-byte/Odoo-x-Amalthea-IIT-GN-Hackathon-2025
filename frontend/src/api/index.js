import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api' });

export const login = (credentials) => API.post('/login', credentials);
export const submitExpense = (expenseData) => API.post('/expenses', expenseData);
export const getPendingExpenses = () => API.get('/expenses/pending');
export const updateExpenseStatus = (id, status) => API.patch(`/expenses/${id}/status`, { status });