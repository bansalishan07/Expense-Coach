import os
import re
import datetime
from typing import List, Dict, Any
from database import execute_raw_select_query

# Optional OpenAI import
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

def format_markdown_table(rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return "*Query returned 0 results.*"
    keys = list(rows[0].keys())
    header = "| " + " | ".join(keys) + " |"
    divider = "| " + " | ".join(["---"] * len(keys)) + " |"
    lines = [header, divider]
    for row in rows:
        lines.append("| " + " | ".join(str(row[k] if row[k] is not None else "") for k in keys) + " |")
    return "\n".join(lines)

def generate_response(user_message: str) -> Dict[str, Any]:
    msg_strip = user_message.strip()
    msg_lower = msg_strip.lower()
    
    # 1. Check if raw SELECT query
    if msg_lower.startswith("select"):
        try:
            rows = execute_raw_select_query(msg_strip)
            tbl = format_markdown_table(rows)
            return {
                "response": f"✅ **SQL Query Executed Successfully!**\n\n{tbl}",
                "sql": msg_strip,
                "data": rows,
                "error": None
            }
        except Exception as e:
            return {
                "response": f"❌ **SQL Execution Error:**\n\n```\n{str(e)}\n```",
                "sql": msg_strip,
                "data": None,
                "error": str(e)
            }
            
    # 2. Try to translate natural language using OpenAI (if available and configured)
    api_key = os.getenv("OPENAI_API_KEY")
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    current_month = datetime.datetime.now().strftime("%Y-%m")
    
    if api_key and OPENAI_AVAILABLE:
        try:
            client = OpenAI(api_key=api_key)
            
            # Step A: Translate natural language to SQL
            system_translation = (
                "You are an assistant that converts user natural language questions about their expenses into a single, valid SQLite SELECT query.\n"
                "The database contains the following tables and columns:\n"
                "1. `expenses` table:\n"
                "   - `amount` (REAL) - transaction amount in Rupees\n"
                "   - `category` (TEXT) - category of expense (e.g. 'Food & Dining', 'Transportation', 'Shopping', 'Housing & Utilities', 'Entertainment', 'Other')\n"
                "   - `date` (TEXT) - date formatted as YYYY-MM-DD\n"
                "   - `description` (TEXT) - description of purchase\n"
                "2. `profile` table:\n"
                "   - `name` (TEXT) - user's name\n"
                "   - `target_amount` (REAL) - monthly budget limit\n"
                "   - `next_month_deduction` (REAL) - deductions carried over from last month\n\n"
                f"Today's date context is: {current_date} (current month: {current_month}).\n"
                "Rules:\n"
                "- Only output the raw SQL query. Do not wrap in markdown code blocks or backticks. Only output SELECT statements.\n"
                "- Return a query that fetches relevant columns so we can summarize it.\n"
                "- Keep the SQL query simple and highly specific to the user's question."
            )
            
            sql_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_translation},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=150,
                temperature=0.0
            )
            
            sql_query = sql_response.choices[0].message.content.strip()
            # Clean up potential markdown formatting from LLM
            sql_query = re.sub(r"^```sql\s*", "", sql_query)
            sql_query = re.sub(r"^```\s*", "", sql_query)
            sql_query = re.sub(r"\s*```$", "", sql_query)
            
            # Step B: Execute the translated SQL query
            try:
                rows = execute_raw_select_query(sql_query)
            except Exception as sql_err:
                print(f"Generated SQL failed to execute: {sql_query}. Error: {sql_err}")
                raise sql_err
                
            # Step C: Summarize the results with LLM
            system_explanation = (
                "You are a personal finance Expense Advisor. You just ran a database SQL query to answer the user's question.\n"
                "Use the raw SQL results to answer the user's question in a helpful, encouraging, yet disciplined financial advice tone.\n"
                "Always format money in Rupees (₹).\n\n"
                f"User Question: {user_message}\n"
                f"SQL Executed: {sql_query}\n"
                f"SQL Results (JSON): {str(rows)}\n\n"
                "Explain the results concisely. Format with bold text, clean spacing, and bullet points where appropriate."
            )
            
            explanation_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_explanation},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=300,
                temperature=0.4
            )
            
            explanation = explanation_response.choices[0].message.content.strip()
            
            return {
                "response": explanation,
                "sql": sql_query,
                "data": rows,
                "error": None
            }
            
        except Exception as e:
            print(f"OpenAI workflow error: {e}. Falling back to local responder.")

    # 3. Local fallback SQL matchers (Offline / API Key failure mode)
    sql_query = None
    explanation_fn = None
    extracted_amount = None
    
    if any(w in msg_lower for w in ["most", "highest", "where did i spend", "category"]):
        sql_query = "SELECT category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC"
        def explain_most(rows):
            if not rows:
                return "You haven't logged any expenses yet! Once you add some, I'll tell you where you spend the most."
            top = rows[0]
            total_all = sum(r['total'] for r in rows)
            pct = (top['total'] / total_all * 100) if total_all > 0 else 0
            res = f"📊 **Spending Analysis (Local SQL)**:\n\n"
            res += f"Your highest expense category is **{top['category']}**, where you spent a total of **₹{top['total']:.2f}** (which represents **{pct:.1f}%** of your total spending).\n\n"
            res += "Here is your category-wise breakdown:\n"
            for r in rows:
                cat_pct = (r['total'] / total_all * 100) if total_all > 0 else 0
                res += f"- **{r['category']}**: ₹{r['total']:.2f} ({cat_pct:.1f}%)\n"
            return res
        explanation_fn = explain_most
        
    elif any(w in msg_lower for w in ["total spent", "how much did i spend", "overall spent", "spent overall", "total spending"]):
        sql_query = "SELECT SUM(amount) AS total FROM expenses"
        def explain_total(rows):
            total = rows[0]['total'] if rows and rows[0]['total'] is not None else 0.0
            return f"💰 **Total Spending (Local SQL)**:\n\nBased on your database query, you have spent a total of **₹{total:.2f}** overall."
        explanation_fn = explain_total
        
    elif any(w in msg_lower for w in ["spent this month", "spending this month", "this month"]):
        sql_query = f"SELECT SUM(amount) AS total FROM expenses WHERE date LIKE '{current_month}%'"
        def explain_month(rows):
            total = rows[0]['total'] if rows and rows[0]['total'] is not None else 0.0
            return f"📅 **Spending This Month (Local SQL)**:\n\nBased on your database query, you have spent **₹{total:.2f}** in the month of {current_month}."
        explanation_fn = explain_month
        
    elif any(w in msg_lower for w in ["recent", "transaction", "history", "what did i buy", "logged"]):
        sql_query = "SELECT date, amount, category, description FROM expenses ORDER BY date DESC LIMIT 5"
        def explain_recent(rows):
            if not rows:
                return "You haven't logged any transactions yet!"
            res = "📝 **Recent Transactions (Local SQL)**:\n\nHere are your last 5 transactions:\n"
            for r in rows:
                res += f"- **{r['date']}**: ₹{r['amount']:.2f} for *\"{r['description']}\"* ({r['category']})\n"
            return res
        explanation_fn = explain_recent
        
    elif any(w in msg_lower for w in ["left", "budget", "target", "status", "remaining", "limit"]):
        sql_query = f"SELECT target_amount, next_month_deduction, (SELECT SUM(amount) FROM expenses WHERE date LIKE '{current_month}%') as spent FROM profile WHERE id = 1"
        def explain_budget(rows):
            if not rows:
                return "You haven't set a budget yet! Please set one in the Profile tab."
            row = rows[0]
            target = row['target_amount'] or 0.0
            deduction = row['next_month_deduction'] or 0.0
            spent = row['spent'] or 0.0
            effective = target - deduction
            left = effective - spent
            
            res = f"💳 **Budget Status (Local SQL)**:\n\n"
            res += f"- **Base Budget**: ₹{target:.2f}\n"
            if deduction > 0:
                res += f"- **Overage Deduction**: -₹{deduction:.2f}\n"
                res += f"- **Effective Budget**: ₹{effective:.2f}\n"
            res += f"- **Spent this Month**: ₹{spent:.2f}\n"
            if left >= 0:
                res += f"\n🎉 You have **₹{left:.2f}** remaining in your budget for this month. Keep it up!"
            else:
                res += f"\n⚠️ **Budget Exceeded!** You are over budget by **₹{abs(left):.2f}**."
            return res
        explanation_fn = explain_budget
        
    elif any(w in msg_lower for w in ["afford", "can i buy", "can i spend", "purchase"]):
        # Extract digits
        amounts = re.findall(r'\d+(?:\.\d+)?', msg_lower)
        extracted_amount = float(amounts[0]) if amounts else 1000.0
        sql_query = f"SELECT target_amount, next_month_deduction, (SELECT SUM(amount) FROM expenses WHERE date LIKE '{current_month}%') as spent FROM profile WHERE id = 1"
        
        def explain_afford(rows):
            if not rows:
                return "No budget target configured in your Profile."
            row = rows[0]
            target = row['target_amount'] or 0.0
            deduction = row['next_month_deduction'] or 0.0
            spent = row['spent'] or 0.0
            effective = target - deduction
            left = effective - spent
            
            if left >= extracted_amount:
                new_left = left - extracted_amount
                return f"🟢 **Yes, you can afford it!**\n\nSpending **₹{extracted_amount:.2f}** will leave you with **₹{new_left:.2f}** remaining in your monthly budget. Happy saving!"
            else:
                over_by = extracted_amount - max(0.0, left)
                return f"🔴 **No, this exceeds your budget!**\n\nBuying this for **₹{extracted_amount:.2f}** will exceed your remaining budget (₹{max(0.0, left):.2f}) by **₹{over_by:.2f}**.\n\nIf you mark this transaction as *'Urgent'*, it will be allowed but ₹{over_by:.2f} will be deducted from your budget next month!"
        explanation_fn = explain_afford

    # If it is a generic conversation message
    if not sql_query:
        sql_query = "SELECT name FROM profile WHERE id = 1"
        def explain_generic(rows):
            name = rows[0]['name'] if rows and rows[0]['name'] else "User"
            return (
                f"👋 **Hello {name}! I am your SQL-Powered Expense Advisor.**\n\n"
                "I run live SQL database queries to answer your financial questions. Try asking:\n"
                "- 📊 *\"Where did I spend the most?\"*\n"
                "- 💰 *\"How much did I spend in total?\"*\n"
                "- 📅 *\"Show my spending this month\"*\n"
                "- 📝 *\"Show my recent expenses\"*\n"
                "- 💳 *\"What is my remaining budget?\"*\n\n"
                "Or write a raw SQL query directly, like: `SELECT * FROM expenses LIMIT 5`"
            )
        explanation_fn = explain_generic

    # Execute fallback query
    try:
        rows = execute_raw_select_query(sql_query)
        response_text = explanation_fn(rows)
        return {
            "response": response_text,
            "sql": sql_query,
            "data": rows,
            "error": None
        }
    except Exception as err:
        return {
            "response": f"⚠️ **Error running fallback query:** {str(err)}",
            "sql": sql_query,
            "data": None,
            "error": str(err)
        }
