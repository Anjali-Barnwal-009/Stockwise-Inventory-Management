# Stockwise Inventory Management (React + Express + MongoDB)

This is a database-connected implementation, not a UI-only demo. Materials and stock transactions are stored in MongoDB. Reloading the page keeps saved data.

## Requirements
- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## 1) Start MongoDB
Start your local MongoDB service, or create a database in Atlas.

## 2) Start backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and configure `MONGO_URI`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory_management
```
Then run:
```bash
npm run dev
```
API health: http://localhost:5000/api/health

## 3) (Optional) Load the sample data shown in the PDF
Run this only while the selected database has no materials:
```bash
npm run seed
```
It adds 8 sample materials, 9 accepted transactions and 2 rejected attempts. It skips if materials already exist.

## 4) Start frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL printed in terminal, usually http://localhost:5173.

## Features
- Dashboard summary and recent stock transactions
- Add, edit and delete materials (material codes auto-generated; materials with history cannot be deleted)
- Search/filter materials by code/name, unit and stock status
- Inward and outward stock movement
- Insufficient-stock rejection: stock does not change; rejected attempt is recorded, but no accepted transaction history row is created
- Transaction history filters
- MongoDB persistence

## Stock rules
- 0: Out of Stock
- 1–149: Low Stock
- 150+: In Stock
- Inward increases stock, Outward decreases stock
- Outward quantity cannot exceed available stock
- Material code is immutable after creation; stock is changed through transactions only
