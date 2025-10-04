# Odoo-x-Amalthea-IIT-GN-Hackathon-2025

# ExpenseFlow - Expense Management System 💰

A comprehensive full-stack expense management system built with React.js frontend and Express.js backend with SQLite database.

## 🚀 Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Manager, Employee)
- Secure login/signup with password hashing
- Company registration with automatic currency detection

### 📊 Expense Management
- Create expenses manually or via receipt upload
- OCR receipt scanning with Google Cloud Vision API
- Multi-currency support with automatic conversion
- Expense categorization (Travel, Meals, Office Supplies, etc.)
- Draft management with submission workflow

### ⚡ Approval Workflows
- Custom approval rules per employee
- Sequential & parallel approval workflows
- Minimum approval percentage configuration
- Real-time status tracking (Draft → Submitted → Approved/Rejected)

### 👥 User Management
- Admin dashboard for system management
- Team management with user invitation
- Manager oversight for expense approvals
- Employee self-service portal

## 🛠 Tech Stack

**Frontend:**
- React.js 18.2.0
- Axios for API calls
- React DatePicker
- CSS3 with modern responsive design

**Backend:**
- Node.js with Express.js
- SQLite database
- bcryptjs for password hashing
- Multer for file uploads
- Google Cloud Vision API for OCR

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/expense-management.git
cd expense-management
