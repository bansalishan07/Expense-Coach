import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np
from typing import List, Dict, Any

def predict_future_spending(expenses: List[Dict[str, Any]]) -> float:
    if not expenses or len(expenses) < 3:
        return sum(e['amount'] for e in expenses)
    df = pd.DataFrame(expenses)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = df['amount'].astype(float)
    daily_spending = df.groupby('date')['amount'].sum().reset_index()
    daily_spending = daily_spending.sort_values('date')
    if len(daily_spending) < 3:
        return float(daily_spending['amount'].sum())
    start_date = daily_spending['date'].min()
    daily_spending['days_since_start'] = (daily_spending['date'] - start_date).dt.days
    X = daily_spending[['days_since_start']]
    y = daily_spending['amount']
    model = LinearRegression()
    model.fit(X, y)
    last_day = daily_spending['days_since_start'].max()
    next_30_days_X = pd.DataFrame({'days_since_start': np.arange(last_day + 1, last_day + 31)})
    predictions = model.predict(next_30_days_X)
    predicted_total = max(0, float(np.sum(predictions)))
    return predicted_total

def get_saving_advice(expenses: List[Dict[str, Any]]) -> str:
    if not expenses:
        return "Start tracking your expenses to get personalized saving advice!"
    df = pd.DataFrame(expenses)
    df['amount'] = df['amount'].astype(float)
    category_totals = df.groupby('category')['amount'].sum().sort_values(ascending=False)
    top_category = category_totals.index[0]
    total_spent = category_totals.sum()
    advice = f"You have spent a total of ₹{total_spent:.2f}. "
    if "Food" in top_category or "Dining" in top_category:
        advice += "A huge chunk goes to food and dining. Consider meal prepping to save more!"
    elif "Shopping" in top_category:
        advice += "Shopping is your highest expense. Try waiting 48 hours before making non-essential purchases."
    elif "Entertainment" in top_category:
        advice += "Your entertainment costs are high. Look for free local events or rethink a few subscriptions."
    else:
        advice += f"Your highest expense category is {top_category}. Try cutting back 10% in this area next month."
    return advice

def categorize_expense(description: str) -> str:
    desc = description.lower()
    if any(word in desc for word in ["food", "dinner", "lunch", "breakfast", "burger", "pizza", "restaurant", "cafe", "coffee", "snack", "grocery", "zomato", "swiggy", "mcdonald"]):
        return "Food & Dining"
    elif any(word in desc for word in ["uber", "ola", "cab", "taxi", "train", "flight", "bus", "metro", "fuel", "petrol", "parking", "auto", "transport"]):
        return "Transportation"
    elif any(word in desc for word in ["shopping", "clothes", "amazon", "flipkart", "myntra", "shoes", "mall", "electronics"]):
        return "Shopping"
    elif any(word in desc for word in ["rent", "electricity", "water", "internet", "wifi", "bill", "maintenance", "gas", "utility"]):
        return "Housing & Utilities"
    elif any(word in desc for word in ["movie", "ticket", "show", "netflix", "prime", "spotify", "game", "concert", "entertainment"]):
        return "Entertainment"
    return "Other"


