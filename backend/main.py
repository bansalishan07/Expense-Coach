from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import database
import ai_engine
import chat_bot
import random
import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Expense Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

class ExpenseCreate(BaseModel):
    amount: float
    category: str = ""
    date: str
    description: str
    is_urgent: bool = False

class InsightsResponse(BaseModel):
    total_spent: float
    predicted_next_month: float
    advice: str

class BudgetUpdate(BaseModel):
    target_amount: float

class ProfileUpdate(BaseModel):
    name: str = ""
    photo_url: str = ""
    phone: str = ""
    email: str = ""

class OTPSend(BaseModel):
    contact: str
    type: str

class OTPVerify(BaseModel):
    contact: str
    type: str
    otp: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Expense Advisor API"}

@app.post("/budget/")
def update_budget(budget: BudgetUpdate):
    target = budget.target_amount
    current_month = datetime.datetime.now().strftime("%Y-%m")
    all_exps = database.get_all_expenses()
    this_month_spent = sum(e['amount'] for e in all_exps if e['date'].startswith(current_month))
    new_debt = max(0.0, this_month_spent - target)
    database.update_budget(target)
    database.set_next_month_deduction(new_debt)
    return {"message": "Budget and debt recalculated successfully."}

@app.post("/expenses/")
def create_expense(expense: ExpenseCreate):
    if not expense.category:
        expense.category = ai_engine.categorize_expense(expense.description)
    profile = database.get_profile()
    target = profile.get("target_amount", 0.0) if profile else 0.0
    deduction = profile.get("next_month_deduction", 0.0) if profile else 0.0
    if target > 0:
        current_month = datetime.datetime.now().strftime("%Y-%m")
        all_exps = database.get_all_expenses()
        this_month_spent = sum(e['amount'] for e in all_exps if e['date'].startswith(current_month))
        effective_budget = target - deduction
        if this_month_spent + expense.amount > effective_budget:
            overage = (this_month_spent + expense.amount) - effective_budget
            if not expense.is_urgent:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Budget exceeded! You have ₹{max(0, effective_budget - this_month_spent):.2f} left. Mark as 'Urgent' to deduct from next month."
                )
            else:
                addition = expense.amount if this_month_spent >= effective_budget else overage
                database.increment_next_month_deduction(addition)
    database.add_expense(expense.amount, expense.category, expense.date, expense.description)
    return {"message": "Expense added successfully"}

@app.get("/expenses/")
def get_expenses():
    return database.get_all_expenses()

@app.get("/insights/")
def get_insights():
    expenses = database.get_all_expenses()
    total_spent = sum(e['amount'] for e in expenses)
    predicted = ai_engine.predict_future_spending(expenses)
    advice = ai_engine.get_saving_advice(expenses)
    return {
        "total_spent": total_spent,
        "predicted_next_month": predicted,
        "advice": advice
    }

@app.get("/profile/")
def get_profile():
    return database.get_profile()

@app.post("/profile/")
def update_profile(profile: ProfileUpdate):
    database.update_profile(profile.name, profile.photo_url, profile.phone, profile.email)
    return {"message": "Profile updated. Please verify contacts."}

@app.post("/send-otp/")
def send_otp(req: OTPSend):
    if not req.contact:
        raise HTTPException(status_code=400, detail="Contact is required")
    otp = str(random.randint(100000, 999999))
    database.save_otp(req.contact, otp)
    return {"message": f"OTP sent to {req.contact}", "mock_otp": otp}

@app.post("/verify-otp/")
def verify_otp(req: OTPVerify):
    saved_otp = database.get_otp(req.contact)
    if not saved_otp:
        raise HTTPException(status_code=400, detail="No OTP requested for this contact")
    if saved_otp == req.otp:
        database.mark_verified(req.type)
        database.clear_otp(req.contact)
        return {"message": "Verification successful!"}
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP")

class ChatRequest(BaseModel):
    message: str

@app.post("/chat/")
def chat_coach(req: ChatRequest):
    try:
        res = chat_bot.generate_response(req.message)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

