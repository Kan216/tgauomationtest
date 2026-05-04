# 🧠 AI Agent Skill: Telegram Sales Automation System

## 🎯 Goal

Build a production-ready backend system that:

* Receives Telegram messages (text + voice)
* Transcribes voice messages into text
* Uses Gemini AI to extract structured sales data
* Saves data into Google Sheets
* Runs continuously on Railway using webhook architecture

---

## 🏗️ System Architecture

Telegram Bot → Webhook (Express Backend) → Gemini AI → Google Sheets

Optional (later):

* Supabase for storage
* Vercel dashboard

---

## ⚙️ Tech Stack

* Node.js (Express)
* Telegram Bot API
* Google Gemini API
* Google Sheets API
* Railway (deployment)

---

## 📂 Project Structure

/backend
/routes
/services
gemini.js
telegram.js
sheets.js
transcription.js
/utils
index.js
.env

---

## 🔌 Core Features

### 1. Telegram Webhook

* Endpoint: POST /webhook
* Accept Telegram updates
* Detect message types:

  * text
  * voice

---

### 2. Text Processing

* Extract message text
* Send to Gemini for parsing

---

### 3. Voice Processing

* Get file_id
* Download file using Telegram API
* Convert audio to text (Gemini or fallback)
* Send text to Gemini parser

---

### 4. AI Parsing (Gemini)

Input example:
"Sold 3 Coke today"

Output JSON:
{
"product_name": "Coke",
"quantity": 3,
"action_type": "sold",
"date": "today"
}

Supported actions:

* sold
* restock
* update

Agent must:

* Handle messy natural language
* Default date to today if missing
* Validate output format

---

### 5. Google Sheets Integration

Sheets:

* "Daily Sales"
* "Inventory"

Columns:

* date
* product_name
* quantity
* action_type

Rules:

* sold → Daily Sales
* restock/update → Inventory

If sheet doesn't exist:

* create automatically

---

### 6. Error Handling

* Retry failed API calls (3 times)
* Log all errors
* Do not crash server

---

### 7. Environment Variables

Required:

* TELEGRAM_BOT_TOKEN
* GEMINI_API_KEY
* GOOGLE_SERVICE_ACCOUNT_JSON

---

### 8. Deployment Requirements

* Must run on Railway
* Use webhook (NOT polling)
* Must stay active even if no frontend is open

---

## 🚫 Constraints

* Do NOT use polling (use webhook only)
* Do NOT use heavy frameworks
* Keep code modular and simple
* Avoid unnecessary dependencies
* Do NOT hardcode secrets

---

## 🧪 Testing Instructions

Agent must test:

1. Send text message → logs + sheet update
2. Send voice message → transcription works
3. Invalid message → handled gracefully

---

## 📈 Future Extensions (optional)

* Telegram commands:
  /sales today
  /stock list

* Dashboard (React + Vercel)

* Supabase integration

* Daily summary auto-send

---

## 🧠 Agent Behavior Rules

* Think step-by-step before coding
* Create one feature at a time
* Test before moving forward
* Keep functions small and reusable
* Always log important actions

---

## ✅ Definition of Done

System is complete when:

* Telegram message triggers webhook
* Message is parsed by Gemini
* Data is saved correctly in Google Sheets
* Works reliably on Railway
