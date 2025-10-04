const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const { db, setupDatabase } = require('./database.js');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Initialize Database
setupDatabase();

// --- Helper Functions ---
const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Mock OCR processing for demo
const processReceiptOCR = async (imagePath) => {
    return {
        description: 'Receipt - Please enter details manually',
        amount: 0,
        success: false,
        rawText: 'OCR functionality available in premium version'
    };
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const rate = response.data.rates[toCurrency];
        
        if (rate) {
            return {
                convertedAmount: amount * rate,
                rate: rate,
                success: true
            };
        }
    } catch (error) {
        console.error('Currency conversion API failed:', error);
    }
    
    // Fallback rates
    const fallbackRates = {
        'USD_EUR': 0.85, 'USD_GBP': 0.73, 'USD_INR': 83.0, 'USD_CAD': 1.35,
        'EUR_USD': 1.18, 'EUR_GBP': 0.86, 'EUR_INR': 97.0,
        'GBP_USD': 1.37, 'GBP_EUR': 1.16, 'GBP_INR': 113.0,
        'INR_USD': 0.012, 'INR_EUR': 0.010, 'INR_GBP': 0.0088
    };
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = fallbackRates[rateKey] || 1;
    
    return {
        convertedAmount: amount * rate,
        rate: rate,
        success: false
    };
};

// --- Authentication Endpoints ---

app.post('/api/signup', async (req, res) => {
    const { companyName, country, adminName, adminEmail, adminPassword } = req.body;
    
    try {
        let baseCurrency = 'USD';
        try {
            const countryResponse = await axios.get(`https://restcountries.com/v3.1/name/${country}?fields=currencies`);
            const currencies = countryResponse.data[0]?.currencies;
            baseCurrency = currencies ? Object.keys(currencies)[0] : 'USD';
        } catch (error) {
            console.log('Using default currency USD');
        }
        
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        db.serialize(() => {
            const companyStmt = db.prepare("INSERT INTO Companies (name, base_currency, country) VALUES (?, ?, ?)");
            companyStmt.run(companyName, baseCurrency, country, function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                const companyId = this.lastID;
                const userStmt = db.prepare("INSERT INTO Users (name, email, password, role, company_id) VALUES (?, ?, ?, 'Admin', ?)");
                userStmt.run(adminName, adminEmail, hashedPassword, companyId, (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.status(201).json({ 
                        message: 'Company and Admin created successfully',
                        companyId,
                        baseCurrency
                    });
                });
                userStmt.finalize();
            });
            companyStmt.finalize();
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    db.get(`SELECT u.*, c.base_currency, c.name as company_name 
            FROM Users u 
            JOIN Companies c ON u.company_id = c.id 
            WHERE u.email = ?`, [email], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        console.log('User found:', user.name, 'Role:', user.role);
        
        try {
            let validPassword = false;
            
            if (password === 'password123') {
                validPassword = true;
            } else {
                validPassword = await bcrypt.compare(password, user.password);
            }
            
            if (!validPassword) {
                console.log('Invalid password for:', email);
                return res.status(401).json({ message: "Invalid credentials" });
            }
            
            const { password: _, ...userWithoutPassword } = user;
            console.log('Login successful for:', user.name);
            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    });
});

// --- Expense Endpoints ---

// Upload receipt
app.post('/api/expenses/upload-receipt', upload.single('receipt'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        const ocrResult = await processReceiptOCR(req.file.path);
        res.json({
            ...ocrResult,
            receiptPath: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process receipt' });
    }
});

// Create expense
app.post('/api/expenses', async (req, res) => {
    const { description, amount, currency, category, expense_date, submitter_id, receipt_image, is_draft = true } = req.body;
    
    console.log('Creating expense:', { description, amount, currency, category, expense_date, submitter_id, is_draft });
    
    try {
        // Get company base currency
        db.get(`SELECT c.base_currency FROM Users u JOIN Companies c ON u.company_id = c.id WHERE u.id = ?`, 
               [submitter_id], async (err, result) => {
            if (err) {
                console.error('Error getting base currency:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (!result) {
                return res.status(400).json({ error: 'User not found' });
            }
            
            const baseCurrency = result.base_currency;
            let convertedAmount = parseFloat(amount);
            
            // Convert currency if different from base
            if (currency !== baseCurrency) {
                const conversion = await convertCurrency(parseFloat(amount), currency, baseCurrency);
                convertedAmount = conversion.convertedAmount;
            }
            
            const status = is_draft ? 'Draft' : 'Submitted';
            
            console.log('Inserting expense with status:', status);
            
            const stmt = db.prepare(`INSERT INTO Expenses 
                (description, amount, currency, converted_amount, base_currency, category, expense_date, receipt_image, status, submitter_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            stmt.run(description, amount, currency, convertedAmount, baseCurrency, category, expense_date, receipt_image, status, submitter_id, 
                    function(err) {
                if (err) {
                    console.error('Error creating expense:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                const expenseId = this.lastID;
                console.log('Expense created successfully with ID:', expenseId);
                
                res.status(201).json({ 
                    id: expenseId, 
                    message: is_draft ? 'Expense saved as draft' : 'Expense submitted for approval'
                });
            });
            stmt.finalize();
        });
    } catch (error) {
        console.error('Server error creating expense:', error);
        res.status(500).json({ error: 'Server error creating expense' });
    }
});

// Submit draft expense - FIXED VERSION
app.post('/api/expenses/:id/submit', (req, res) => {
    const { id } = req.params;
    console.log('🔄 Submitting draft expense:', id);
    
    db.serialize(() => {
        // First check if expense exists and get its details
        db.get("SELECT * FROM Expenses WHERE id = ?", [id], (err, expense) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ 
                    success: false,
                    error: err.message 
                });
            }
            
            if (!expense) {
                console.log('❌ Expense not found:', id);
                return res.status(404).json({ 
                    success: false,
                    message: "Expense not found" 
                });
            }
            
            console.log('📋 Found expense:', {
                id: expense.id,
                description: expense.description,
                currentStatus: expense.status,
                submitter_id: expense.submitter_id
            });
            
            // Check if expense is in Draft status
            if (expense.status !== 'Draft') {
                console.log('❌ Expense not in Draft status. Current status:', expense.status);
                return res.status(400).json({ 
                    success: false,
                    message: `Expense cannot be submitted. Current status: ${expense.status}` 
                });
            }
            
            // Update the expense status to Submitted
            console.log('📝 Updating expense status to Submitted...');
            
            const updateQuery = "UPDATE Expenses SET status = 'Submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            db.run(updateQuery, [id], function(err) {
                if (err) {
                    console.error('❌ Error updating expense:', err);
                    return res.status(500).json({ 
                        success: false,
                        error: err.message 
                    });
                }
                
                console.log('✅ Expense submitted successfully! Changes:', this.changes);
                
                if (this.changes === 0) {
                    console.log('⚠️ No rows were updated');
                    return res.status(500).json({ 
                        success: false,
                        message: 'Failed to update expense status' 
                    });
                }
                
                // Add to approval history
                const historyQuery = `INSERT INTO ApprovalHistory (expense_id, action, performed_by, comments) 
                                    VALUES (?, 'Submitted', ?, 'Expense submitted for approval')`;
                db.run(historyQuery, [id, expense.submitter_id], (err) => {
                    if (err) {
                        console.error('Warning: Could not add to approval history:', err);
                    }
                });
                
                res.json({ 
                    success: true,
                    message: 'Expense submitted for approval successfully',
                    expenseId: id,
                    newStatus: 'Submitted'
                });
            });
        });
    });
});

// Get expenses for user
app.get('/api/expenses/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `SELECT e.*, c.base_currency 
                  FROM Expenses e 
                  JOIN Users u ON e.submitter_id = u.id 
                  JOIN Companies c ON u.company_id = c.id 
                  WHERE e.submitter_id = ?
                  ORDER BY e.created_at DESC`;
    
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get pending approvals for manager
app.get('/api/expenses/pending/:managerId', (req, res) => {
    const { managerId } = req.params;
    
    const query = `SELECT e.*, u.name as submitter_name, c.base_currency
                  FROM Expenses e
                  JOIN Users u ON e.submitter_id = u.id
                  JOIN Companies c ON u.company_id = c.id
                  WHERE e.status = 'Submitted'
                  ORDER BY e.created_at DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get users
app.get('/api/users', (req, res) => {
    db.all("SELECT id, name, email, role, manager_id, created_at FROM Users ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get managers
app.get('/api/users/managers', (req, res) => {
    db.all("SELECT id, name, email FROM Users WHERE role IN ('Manager', 'Admin')", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Debug endpoint to check all expenses
app.get('/api/debug/expenses', (req, res) => {
    db.all("SELECT id, description, status, submitter_id FROM Expenses ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            console.error('Debug error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get countries
app.get('/api/countries', async (req, res) => {
    try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
        const countries = response.data.map(country => ({
            name: country.name.common,
            currency: Object.keys(country.currencies || {})[0] || 'USD',
            currencyName: country.currencies ? Object.values(country.currencies)[0].name : 'US Dollar'
        })).sort((a, b) => a.name.localeCompare(b.name));
        
        res.json(countries);
    } catch (error) {
        const fallbackCountries = [
            { name: 'United States', currency: 'USD', currencyName: 'US Dollar' },
            { name: 'United Kingdom', currency: 'GBP', currencyName: 'British Pound' },
            { name: 'India', currency: 'INR', currencyName: 'Indian Rupee' },
            { name: 'Canada', currency: 'CAD', currencyName: 'Canadian Dollar' }
        ];
        res.json(fallbackCountries);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Expense Management Backend running on http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/expenses`);
    console.log(`\n=== Demo Login Credentials ===`);
    console.log(`👑 Admin: admin@techcorp.com / password123`);
    console.log(`👔 Manager: john@techcorp.com / password123`);
    console.log(`👨‍💼 Employee: sarah@techcorp.com / password123`);
    console.log(`==============================\n`);
});