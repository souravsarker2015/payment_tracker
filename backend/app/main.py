from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routers import auth, creditors, transactions, debtors, debtor_transactions, contributors, contributor_transactions, expenses, ponds, suppliers, labor, fish_sales, units, pond_feeds, dashboard, persons, organizations, incomes, income_dashboard
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Payment Tracker SaaS")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=[
    #     "http://localhost:3000",
    #     "http://127.0.0.1:3000",
    #     "https://payment-tracker-1.onrender.com"
    # ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(creditors.router)
app.include_router(transactions.router)
app.include_router(debtors.router)
app.include_router(debtor_transactions.router)
app.include_router(contributors.router)
app.include_router(contributor_transactions.router)
app.include_router(expenses.router)
app.include_router(ponds.router)
app.include_router(suppliers.router)
app.include_router(labor.router)
app.include_router(fish_sales.router)
app.include_router(units.router)
app.include_router(pond_feeds.router)
app.include_router(dashboard.router)
app.include_router(persons.router)
app.include_router(organizations.router)
app.include_router(incomes.router)
app.include_router(income_dashboard.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    
    # Fix PostgreSQL sequences (ensures auto-increment works after data imports)
    try:
        from app.db_utils import fix_sequences
        fix_sequences()
    except Exception as e:
        print(f"Warning: Failed to fix sequences: {e}")
    
    # Seed default units if they don't exist
    try:
        from app.seed_units import seed_units
        seed_units()
    except Exception as e:
        print(f"Warning: Failed to seed units: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Payment Tracker API"}
