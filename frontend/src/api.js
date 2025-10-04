import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/login', credentials),
    signup: (companyData) => api.post('/signup', companyData),
};

export const userAPI = {
    getUsers: (params) => api.get('/users', { params }),
    getManagers: () => api.get('/users/managers'),
    createUser: (userData) => api.post('/users', userData),
};

export const expenseAPI = {
    uploadReceipt: (formData) => api.post('/expenses/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    createExpense: (expenseData) => api.post('/expenses', expenseData),
    submitExpense: (expenseId) => api.post(`/expenses/${expenseId}/submit`),
    getUserExpenses: (userId, status) => api.get(`/expenses/user/${userId}`, { params: { status } }),
    getPendingExpenses: (managerId) => api.get(`/expenses/pending/${managerId}`),
    approveExpense: (expenseId, actionData) => api.post(`/expenses/${expenseId}/approve`, actionData),
    getExpenseHistory: (expenseId) => api.get(`/expenses/${expenseId}/history`),
};

export const approvalAPI = {
    createRule: (ruleData) => api.post('/approval-rules', ruleData),
    getRuleForUser: (userId) => api.get(`/approval-rules/user/${userId}`),
};

export const systemAPI = {
    convertCurrency: (amount, fromCurrency, toCurrency) => 
        api.get(`/convert-currency?amount=${amount}&fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`),
    getCountries: () => api.get('/countries'),
};

// Debug API for testing
export const debugAPI = {
    getAllExpenses: () => api.get('/debug/expenses'),
    getHealth: () => api.get('/health'),
};

export default api;