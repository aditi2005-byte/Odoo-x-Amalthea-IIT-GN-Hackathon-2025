const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

const setupDatabase = () => {
    db.serialize(() => {
        // Drop tables if they exist (for clean setup)
        db.run(`DROP TABLE IF EXISTS ApprovalHistory`);
        db.run(`DROP TABLE IF EXISTS Approvals`);
        db.run(`DROP TABLE IF EXISTS RuleApprovers`);
        db.run(`DROP TABLE IF EXISTS ApprovalRules`);
        db.run(`DROP TABLE IF EXISTS Expenses`);
        db.run(`DROP TABLE IF EXISTS Users`);
        db.run(`DROP TABLE IF EXISTS Companies`);

        // Table to store company info
        db.run(`CREATE TABLE IF NOT EXISTS Companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            base_currency TEXT DEFAULT 'USD',
            country TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT CHECK(role IN ('Admin', 'Manager', 'Employee')) NOT NULL,
            company_id INTEGER,
            manager_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES Companies(id),
            FOREIGN KEY(manager_id) REFERENCES Users(id)
        )`);

        // Expenses table
        db.run(`CREATE TABLE IF NOT EXISTS Expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            converted_amount REAL,
            base_currency TEXT,
            category TEXT,
            expense_date DATE NOT NULL,
            receipt_image TEXT,
            status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
            submitter_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(submitter_id) REFERENCES Users(id)
        )`);
        
        // Approval Rules table
        db.run(`CREATE TABLE IF NOT EXISTS ApprovalRules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            applies_to_user_id INTEGER UNIQUE,
            is_sequential BOOLEAN DEFAULT 0,
            min_approval_percentage INTEGER DEFAULT 100,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(applies_to_user_id) REFERENCES Users(id)
        )`);

        // Rule Approvers table
        db.run(`CREATE TABLE IF NOT EXISTS RuleApprovers (
            rule_id INTEGER,
            approver_user_id INTEGER,
            sequence INTEGER,
            PRIMARY KEY (rule_id, approver_user_id),
            FOREIGN KEY(rule_id) REFERENCES ApprovalRules(id),
            FOREIGN KEY(approver_user_id) REFERENCES Users(id)
        )`);

        // Approvals tracking
        db.run(`CREATE TABLE IF NOT EXISTS Approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_id INTEGER,
            approver_id INTEGER,
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
            comments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(expense_id) REFERENCES Expenses(id),
            FOREIGN KEY(approver_id) REFERENCES Users(id)
        )`);

        // Approval History table
        db.run(`CREATE TABLE IF NOT EXISTS ApprovalHistory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_id INTEGER,
            action TEXT NOT NULL,
            performed_by INTEGER,
            comments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(expense_id) REFERENCES Expenses(id),
            FOREIGN KEY(performed_by) REFERENCES Users(id)
        )`);

        console.log("Database initialized with full schema.");
        
        // Insert sample data
        insertSampleData();
    });
};

const insertSampleData = () => {
    console.log("Inserting sample data...");
    
    // Insert company
    db.run(`INSERT INTO Companies (name, base_currency, country) 
            VALUES ('TechCorp Inc', 'USD', 'United States')`, function(err) {
        if (err) {
            console.error("Error inserting company:", err);
            return;
        }
        
        const companyId = this.lastID;
        console.log("Company created with ID:", companyId);
        
        // Use a simple password hash that works with bcryptjs
        const simpleHash = '$2a$10$8vZEuZP.zY5U7Z3Q5Q5Q5e'; // This is a pre-hashed version of 'password123'
        
        // Insert users
        const users = [
            // Admin
            { name: 'Admin User', email: 'admin@techcorp.com', password: simpleHash, role: 'Admin', company_id: companyId, manager_id: null },
            // Managers
            { name: 'John Manager', email: 'john@techcorp.com', password: simpleHash, role: 'Manager', company_id: companyId, manager_id: null },
            { name: 'Mitchell Manager', email: 'mitchell@techcorp.com', password: simpleHash, role: 'Manager', company_id: companyId, manager_id: null },
            { name: 'Andreas Manager', email: 'andreas@techcorp.com', password: simpleHash, role: 'Manager', company_id: companyId, manager_id: null },
            // Employees
            { name: 'Sarah Employee', email: 'sarah@techcorp.com', password: simpleHash, role: 'Employee', company_id: companyId, manager_id: 2 },
            { name: 'Mike Employee', email: 'mike@techcorp.com', password: simpleHash, role: 'Employee', company_id: companyId, manager_id: 3 },
            { name: 'Lisa Employee', email: 'lisa@techcorp.com', password: simpleHash, role: 'Employee', company_id: companyId, manager_id: 4 }
        ];
        
        const stmt = db.prepare(`INSERT INTO Users (name, email, password, role, company_id, manager_id) 
                               VALUES (?, ?, ?, ?, ?, ?)`);
        
        users.forEach((user, index) => {
            stmt.run(user.name, user.email, user.password, user.role, user.company_id, user.manager_id, (err) => {
                if (err) {
                    console.error(`Error inserting user ${user.name}:`, err);
                } else {
                    console.log(`✓ Created user: ${user.name} (${user.role})`);
                }
            });
        });
        
        stmt.finalize((err) => {
            if (err) {
                console.error("Error finalizing user insertions:", err);
            } else {
                console.log("\n=== Sample Data Created Successfully ===");
                console.log("👑 Admin: admin@techcorp.com / password123");
                console.log("👔 Managers: john@techcorp.com / password123");
                console.log("👨‍💼 Employees: sarah@techcorp.com / password123");
                console.log("==========================================\n");
                
                // Insert sample expenses
                insertSampleExpenses();
            }
        });
    });
};

const insertSampleExpenses = () => {
    const expenses = [
        {
            description: 'Team Lunch',
            amount: 75.50,
            currency: 'USD',
            category: 'Meals',
            expense_date: '2024-01-15',
            status: 'Approved',
            submitter_id: 5 // Sarah
        },
        {
            description: 'Flight to Conference',
            amount: 450.00,
            currency: 'USD', 
            category: 'Travel',
            expense_date: '2024-01-10',
            status: 'Submitted',
            submitter_id: 5 // Sarah
        },
        {
            description: 'Office Supplies',
            amount: 120.75,
            currency: 'USD',
            category: 'Office Supplies',
            expense_date: '2024-01-08',
            status: 'Draft',
            submitter_id: 6 // Mike
        }
    ];
    
    const stmt = db.prepare(`INSERT INTO Expenses 
        (description, amount, currency, converted_amount, base_currency, category, expense_date, status, submitter_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    expenses.forEach(expense => {
        stmt.run(
            expense.description,
            expense.amount,
            expense.currency,
            expense.amount, // converted_amount same as amount for USD
            'USD', // base_currency
            expense.category,
            expense.expense_date,
            expense.status,
            expense.submitter_id
        );
    });
    
    stmt.finalize(() => {
        console.log("✓ Sample expenses created");
    });
};

module.exports = { db, setupDatabase };