# ⚖️ LegalMet-AI
### AI-Powered Legal Metrology Inspection Assistant

LegalMet-AI is an AI-powered web application designed to assist Legal Metrology inspectors in inspecting packaged commodities by automating product declaration extraction, regulatory rule evaluation, and inspection report generation.

The project focuses on streamlining the inspection process under the **Legal Metrology (Packaged Commodities) Rules, 2011**, using Artificial Intelligence and a structured digital inspection workflow.

---

## 🚀 Project Demo

🎥 **Demo Video:** See the project demonstration uploaded on LinkedIn.

🌐 **Live Application:** [LegalMet-AI](https://legalmet-ai.onrender.com)

📂 **GitHub Repository:** [LegalMet-AI](https://github.com/rohinthan04-ai/LegalMet)

---

## 📌 Problem Statement

Traditional packaged commodity inspections require inspectors to manually examine product packages and verify their mandatory declarations against applicable Legal Metrology regulations.

This process can be time-consuming and requires careful cross-verification of multiple regulatory requirements.

LegalMet-AI aims to simplify this process through AI-assisted inspection and automated compliance evaluation.

---

## 💡 Key Features

- **Inspector Authentication:** Secure login and authentication for inspectors.
- **Digital Inspection Management:** Create and manage individual product inspections.
- **Image Upload:** Upload packaged commodity images for analysis.
- **AI-Powered OCR:** Extract product declarations and relevant information from package images.
- **Automated Rule Evaluation:** Evaluate extracted product information against applicable regulatory requirements using Google Gemini.
- **Compliance Checklist:** Generate structured PASS/FAIL evaluation results.
- **Inspection History:** Access previously conducted inspections and their statuses.
- **PDF Report Generation:** Generate downloadable inspection reports containing evaluation results and supporting evidence.
- **Database Integration:** Store inspection records, images, extracted details, and reports.

---

## 🔄 How It Works

1. **Inspector Login** – The inspector securely logs into the application.
2. **Create Inspection** – A new inspection record is created.
3. **Upload Product Image** – The inspector uploads an image of the packaged commodity.
4. **AI-Based Extraction** – The AI analyzes the image and extracts relevant product declarations.
5. **Regulatory Evaluation** – Extracted information is evaluated against applicable Legal Metrology rules.
6. **Compliance Assessment** – The system generates structured PASS/FAIL results.
7. **Report Generation** – A PDF inspection report is generated and stored.
8. **Inspection History** – The completed inspection is available for future reference.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Database Hosting | Neon |
| AI Integration | Google Gemini API |
| Authentication | JWT |
| API Communication | REST APIs |
| Deployment | Render |
| Version Control | Git & GitHub |

---

## 🏗️ System Architecture

```text
             INSPECTOR
                 |
                 v
          React Frontend
                 |
                 v
          FastAPI Backend
                 |
       +---------+----------+
       |         |          |
       v         v          v
  PostgreSQL   Gemini API  PDF Generator
   (Neon)          |
       |           v
       |      Image Analysis
       |      & Rule Evaluation
       |           |
       +-----------+
                 |
                 v
          Inspection Results
                 |
                 v
           PDF Report
```

---

## 🗄️ Database

LegalMet-AI uses PostgreSQL to manage its inspection data.

The database includes the following core tables:

- `inspector` – Inspector account information.
- `inspections` – Inspection records and their statuses.
- `images` – Uploaded product images and extracted product details.
- `category` – Product categories.
- `rules` – Regulatory rules and requirements.
- `category_rule` – Mapping between product categories and applicable rules.
- `reports` – Generated inspection reports and AI evaluation results.

---

## 💻 Running the Project Locally

### Prerequisites

- Python 3.10+
- Node.js (LTS)
- PostgreSQL database
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/rohinthan04-ai/LegalMet.git

cd LegalMet
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables for database connectivity, authentication, and Gemini API access using your local `.env` file.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend API documentation:

```text
http://localhost:8000/docs
```

### 3. Set Up the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local frontend URL displayed in your terminal.

---

## 🔐 Environment Configuration

The application requires configuration for:

- PostgreSQL database connection.
- Google Gemini API credentials.
- JWT authentication and secret key.
- Frontend-to-backend API communication.

**Important:** Never commit API keys, database credentials, JWT secrets, or `.env` files to GitHub.

---

## 🎯 Project Objectives

- Reduce manual effort involved in packaged commodity inspections.
- Assist inspectors in identifying missing or non-compliant declarations.
- Improve consistency in regulatory rule evaluation.
- Digitize inspection records and reporting.
- Explore practical applications of AI in regulatory compliance.

---

## ⚠️ Disclaimer

LegalMet-AI is an educational and demonstration project developed to explore AI-assisted Legal Metrology inspections.

It is not an official government application or a substitute for the judgment of an authorized Legal Metrology inspector. AI-generated evaluations require verification against the applicable regulations and physical product declarations.

---

## 👨‍💻 Developer

**Rohinthan K.**

B.Tech – Artificial Intelligence and Data Science

Sri Krishna College of Engineering and Technology

GitHub: [@rohinthan04-ai](https://github.com/rohinthan04-ai)

---

*Built with Python, React, PostgreSQL, and Artificial Intelligence.*
