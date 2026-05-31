# 📊 AI Data Analytics Dashboard

A full-stack AI-powered web application that allows users to upload CSV files and get instant insights using data analytics, machine learning, and NLP.

This project helps in understanding how real-world data science workflows work through an interactive dashboard.

---

## 🚀 Features

- Upload CSV files and automatically detect column types  
- Dataset overview with summary statistics and missing values  
- Interactive visualizations (bar, pie, line, correlation heatmap)  
- Machine learning predictions (classification & regression)  
- NLP analysis including sentiment analysis and keyword extraction  
- Clean and interactive dashboard UI  

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- TailwindCSS
- Recharts

**Backend**
- FastAPI (Python)
- SQLAlchemy

**Database**
- PostgreSQL (SQLite supported for local development)

**Machine Learning**
- pandas
- numpy
- scikit-learn

**NLP**
- TextBlob
- NLTK

---

## 📁 Project Structure


resumeproject/
├── backend/ # FastAPI backend
│ ├── main.py
│ ├── routes/
│ ├── services/
│ ├── ml/
│ ├── models/
│ └── database/
│
├── frontend/ # React frontend
│ └── src/
│ ├── components/
│ ├── pages/
│ └── services/
│
├── sample_data/ # Sample CSV file
└── docker-compose.yml


---

## ⚙️ How to Run

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-data-dashboard.git
cd ai-data-dashboard
2. Backend Setup
cd backend
python -m venv venv

venv\Scripts\activate   # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

uvicorn main:app --reload --port 8000

Backend runs at:
👉 http://localhost:8000/docs

3. Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs at:
👉 http://localhost:5173

📌 How to Use
Open the frontend in browser
Upload sample_data/sample.csv
Explore:
Analytics
Visualizations
Machine Learning predictions
NLP insights
🧠 Machine Learning Logic
Numeric target → Regression model
Categorical target → Classification model
Models used:
Linear Regression
Random Forest
📊 API Endpoints
POST /api/upload → Upload dataset
GET /api/columns → Column details
GET /api/stats → Dataset statistics
GET /api/visuals → Visualization data
POST /api/train → Train ML model
POST /api/predict → Make predictions
GET /api/nlp-analysis → NLP insights
⭐ Future Improvements
Deploy frontend and backend online
Add authentication system
Improve UI/UX design
Add more ML models
Export reports as PDF
📌 Note

Built as a learning project for AI + Data Science + Full Stack development.
This project is for learning and portfolio use.