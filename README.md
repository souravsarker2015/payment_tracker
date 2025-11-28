# Payment Tracker SaaS

A full-stack web application for tracking money borrowed from and repaid to creditors. Built with FastAPI (Python) backend and Next.js (React/TypeScript) frontend.

## Features

- **User Authentication**: Secure JWT-based authentication
- **Creditor Management**: Add, edit, and delete creditors
- **Transaction Tracking**: Record borrowing and repayment transactions
- **Visual Analytics**:
  - Dashboard with doughnut chart showing creditor balances
  - Balance history line charts per creditor
  - Transaction breakdown pie charts
- **Transaction Management**: Edit and delete transactions with modal interfaces
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLModel**: SQL database ORM with Pydantic integration
- **Alembic**: Database migrations
- **SQLite**: Database (development)
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Charting library
- **Axios**: HTTP client
- **Lucide React**: Icon library

## Project Structure

```
payment_tracker/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── creditors.py     # Creditor CRUD endpoints
│   │   │   └── transactions.py  # Transaction CRUD endpoints
│   │   ├── models.py            # Database models
│   │   ├── database.py          # Database configuration
│   │   ├── auth.py              # JWT utilities
│   │   └── main.py              # FastAPI app entry point
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt         # Python dependencies
│   └── database.db              # SQLite database
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/          # Authentication pages
    │   │   └── dashboard/       # Dashboard pages
    │   ├── components/          # Reusable components
    │   └── lib/                 # Utilities (API client)
    ├── package.json
    └── tailwind.config.ts
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /token` - Login and get JWT token

### Creditors
- `GET /creditors` - List all creditors
- `POST /creditors` - Create a new creditor
- `GET /creditors/{id}` - Get creditor details
- `PUT /creditors/{id}` - Update creditor
- `DELETE /creditors/{id}` - Delete creditor

### Transactions
- `GET /transactions` - List all transactions
- `POST /transactions` - Create a new transaction
- `PUT /transactions/{id}` - Update transaction
- `DELETE /transactions/{id}` - Delete transaction

## Environment Variables

### Backend
Create a `.env` file in the `backend/` directory (recommended for production):
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./database.db
```

### Frontend
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Security Notes

⚠️ **Important for Production:**
- Change the hardcoded `SECRET_KEY` in `backend/app/auth.py` to an environment variable
- Update CORS settings in `backend/app/main.py` to restrict allowed origins
- Use a production-grade database (PostgreSQL, MySQL) instead of SQLite
- Enable HTTPS
- Implement rate limiting
- Add input validation and sanitization

## Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build
npm start
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
