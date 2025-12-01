from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routers import auth, creditors, transactions, debtors, debtor_transactions, expenses, ponds, suppliers, labor, fish_sales
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Payment Tracker SaaS")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://payment-tracker-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(creditors.router)
app.include_router(transactions.router)
app.include_router(debtors.router)
app.include_router(debtor_transactions.router)
app.include_router(expenses.router)
app.include_router(ponds.router)
app.include_router(suppliers.router)
app.include_router(labor.router)
app.include_router(fish_sales.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Welcome to Payment Tracker API"}
