# ExpenseFlow - Expense Management System 💰

![ExpenseFlow](https://img.shields.io/badge/ExpenseFlow-Expense%20Management-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive full-stack expense management system built with React.js frontend and Express.js backend with SQLite database. Features role-based access, OCR receipt scanning, multi-currency support, and customizable approval workflows.

## 🚀 Live Demo

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Role-based access control** (Admin, Manager, Employee)
- Secure login/signup with password hashing
- Company registration with automatic currency detection
- Session management with localStorage

### 📊 Expense Management
- **Create expenses** manually or via receipt upload
- **OCR receipt scanning** with Google Cloud Vision API
- **Multi-currency support** with automatic conversion
- **Expense categorization** (Travel, Meals, Office Supplies, Software, Equipment, Training, Other)
- **Draft management** with submission workflow
- **Receipt image storage** and management

### ⚡ Approval Workflows
- **Custom approval rules** per employee
- **Sequential & parallel approval** workflows
- **Minimum approval percentage** configuration
- **Real-time status tracking** (Draft → Submitted → Approved/Rejected)
- **Approval history** with audit trail

### 👥 User Management
- **Admin dashboard** for system management
- **Team management** with user invitation
- **Manager oversight** for expense approvals
- **Employee self-service** portal
- **User role assignment** and hierarchy

### 🌐 Multi-Currency Support
- **Automatic currency detection** based on country
- **Real-time currency conversion** using ExchangeRate API
- **Base currency configuration** per company
- **Fallback conversion rates** for offline use

## 🛠 Technology Stack

### Frontend
- **React.js 18.2.0** - UI framework
- **Axios** - HTTP client for API calls
- **React DatePicker** - Date selection component
- **CSS3** - Modern responsive design with Flexbox/Grid
- **Local Storage** - Session persistence

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite** - Database management
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### External APIs
- **Google Cloud Vision API** - OCR receipt scanning
- **ExchangeRate-API** - Currency conversion
- **RestCountries API** - Country and currency data

<img width="994" height="541" alt="image" src="https://github.com/user-attachments/assets/252e1320-542d-4320-8914-a41f28abea20" />
