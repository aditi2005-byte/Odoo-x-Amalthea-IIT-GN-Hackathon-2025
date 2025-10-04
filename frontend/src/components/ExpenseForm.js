import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { expenseAPI, systemAPI } from '../api';

const ExpenseForm = ({ user, onClose, initialData = null }) => {
    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        amount: initialData?.amount || '',
        currency: initialData?.currency || 'USD',
        category: initialData?.category || 'Travel',
        expense_date: initialData ? new Date(initialData.expense_date) : new Date(),
        receipt_image: initialData?.receipt_image || '',
        is_draft: true
    });
    const [convertedAmount, setConvertedAmount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const [activeMethod, setActiveMethod] = useState('manual'); // 'manual' or 'upload'

    const categories = [
        'Travel', 'Meals', 'Entertainment', 'Office Supplies', 
        'Equipment', 'Software', 'Training', 'Other'
    ];

    const currencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Auto-convert currency when amount or currency changes
        if ((name === 'amount' || name === 'currency') && formData.amount && user.base_currency) {
            convertCurrencyAmount();
        }
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            expense_date: date
        }));
    };

    const convertCurrencyAmount = async () => {
        if (!formData.amount || !formData.currency || !user.base_currency) return;
        
        if (formData.currency !== user.base_currency) {
            try {
                const { data } = await systemAPI.convertCurrency(formData.amount, formData.currency, user.base_currency);
                setConvertedAmount(data.convertedAmount);
            } catch (error) {
                console.error('Currency conversion failed:', error);
                setConvertedAmount(null);
            }
        } else {
            setConvertedAmount(null);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrors({ upload: 'Please upload an image file (JPEG, PNG, etc.)' });
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ upload: 'File size should be less than 5MB' });
            return;
        }

        setUploading(true);
        setErrors({});
        const formDataObj = new FormData();
        formDataObj.append('receipt', file);

        try {
            console.log('Uploading receipt for OCR processing...');
            const { data } = await expenseAPI.uploadReceipt(formDataObj);
            setOcrResult(data);
            console.log('OCR Result:', data);
            
            // Auto-fill form with OCR data
            if (data.success && data.amount > 0) {
                setFormData(prev => ({
                    ...prev,
                    description: data.description || 'Receipt scan',
                    amount: data.amount,
                    receipt_image: data.receiptPath,
                    category: 'Other' // Default category for scanned receipts
                }));
                
                // Show success message
                setErrors({ upload: `✓ Successfully scanned receipt: ${data.amount} ${formData.currency} - ${data.description}` });
            } else {
                // Still save the receipt path even if OCR failed
                setFormData(prev => ({
                    ...prev,
                    receipt_image: data.receiptPath
                }));
                setErrors({ upload: '⚠️ Receipt uploaded but could not read details. Please enter manually.' });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setErrors({ upload: 'Failed to upload receipt. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        
        if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Valid amount is required';
        }
        
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e, isDraft = true) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                submitter_id: user.id,
                expense_date: formData.expense_date.toISOString().split('T')[0],
                is_draft: isDraft
            };

            console.log('Submitting expense:', expenseData);
            const response = await expenseAPI.createExpense(expenseData);
            console.log('Expense created:', response.data);
            
            onClose();
        } catch (error) {
            console.error('Failed to submit expense:', error);
            setErrors({ submit: 'Failed to save expense. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDraft = async (expenseId) => {
        try {
            console.log('Submitting draft expense:', expenseId);
            await expenseAPI.submitExpense(expenseId);
            console.log('Draft submitted successfully');
            onClose();
        } catch (error) {
            console.error('Failed to submit draft:', error);
            setErrors({ submit: 'Failed to submit expense for approval.' });
        }
    };

    const MethodSelection = () => (
        <div className="method-selection">
            <h3 className="method-title">Choose Entry Method</h3>
            <div className="method-options">
                <div 
                    className={`method-option ${activeMethod === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveMethod('manual')}
                >
                    <div className="method-icon">📝</div>
                    <div className="method-content">
                        <h4>Manual Entry</h4>
                        <p>Enter expense details manually</p>
                    </div>
                </div>
                <div 
                    className={`method-option ${activeMethod === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveMethod('upload')}
                >
                    <div className="method-icon">📷</div>
                    <div className="method-content">
                        <h4>Upload Receipt</h4>
                        <p>Scan receipt with OCR</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const UploadSection = () => (
        <div className="upload-section">
            <h4 className="section-title">Upload Receipt</h4>
            
            {errors.upload && (
                <div className={`upload-message ${errors.upload.includes('✓') ? 'success' : 'error'}`}>
                    {errors.upload}
                </div>
            )}
            
            <div className="upload-area-container">
                <label className="upload-label">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="upload-input"
                        disabled={uploading}
                    />
                    <div className="upload-area">
                        {uploading ? (
                            <div className="upload-loading">
                                <div className="loading-spinner"></div>
                                <p>Scanning receipt with OCR...</p>
                            </div>
                        ) : (
                            <>
                                <div className="upload-icon">📷</div>
                                <div className="upload-text">
                                    <strong>Click to upload receipt</strong>
                                    <span>Take a photo or upload receipt image</span>
                                    <small>Supports JPG, PNG (Max 5MB)</small>
                                </div>
                            </>
                        )}
                    </div>
                </label>
            </div>

            {ocrResult && ocrResult.rawText && (
                <div className="ocr-details">
                    <h5>OCR Raw Text:</h5>
                    <div className="ocr-text">
                        {ocrResult.rawText}
                    </div>
                </div>
            )}
        </div>
    );

    const ManualSection = () => (
        <div className="manual-section">
            <h4 className="section-title">Manual Entry</h4>
            <p className="section-subtitle">Enter your expense details below</p>
        </div>
    );

    return (
        <div className="modal-backdrop">
            <div className="modal-content large">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {initialData ? 'Edit Expense' : 'New Expense Claim'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                {errors.submit && (
                    <div className="error-message mb-4">
                        <span>⚠️</span>
                        {errors.submit}
                    </div>
                )}

                <MethodSelection />

                {activeMethod === 'upload' && <UploadSection />}

                <form onSubmit={(e) => handleSubmit(e, true)}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`form-input ${errors.description ? 'error' : ''}`}
                                placeholder="What was this expense for?"
                            />
                            {errors.description && (
                                <div className="error-text">{errors.description}</div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`form-select ${errors.category ? 'error' : ''}`}
                            >
                                <option value="">Select category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <div className="error-text">{errors.category}</div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Expense Date *</label>
                            <DatePicker
                                selected={formData.expense_date}
                                onChange={handleDateChange}
                                className="form-input"
                                dateFormat="MMMM d, yyyy"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Paid By</label>
                            <input
                                type="text"
                                value={user.name}
                                className="form-input"
                                disabled
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Amount *</label>
                        <div className="amount-input-group">
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className={`form-input amount-input ${errors.amount ? 'error' : ''}`}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="form-select currency-select"
                            >
                                {currencies.map(currency => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.amount && (
                            <div className="error-text">{errors.amount}</div>
                        )}
                        {convertedAmount && formData.currency !== user.base_currency && (
                            <div className="conversion-text">
                                ≈ {user.base_currency} {convertedAmount.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {activeMethod === 'upload' && formData.receipt_image && (
                        <div className="form-group">
                            <label className="form-label">Receipt Status</label>
                            <div className="receipt-status success">
                                ✓ Receipt uploaded successfully
                            </div>
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label className="form-label">Additional Notes (Optional)</label>
                        <textarea
                            name="notes"
                            className="form-textarea"
                            placeholder="Any additional information about this expense..."
                            rows="3"
                        />
                    </div>
                    
                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            disabled={loading}
                            onClick={(e) => handleSubmit(e, false)}
                        >
                            {loading ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;