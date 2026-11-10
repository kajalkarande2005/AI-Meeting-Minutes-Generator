# MeetMind AI – AI Meeting Minutes Generator

## Project Overview
MeetMind AI is an AI-powered meeting minutes generator that converts recorded meeting audio into structured and easy-to-understand meeting minutes.

It uses speech recognition and AI-based text summarization to help users save time and organize important meeting information.

## Features
- Upload meeting audio recordings.
- Automatically transcribe speech into text.
- Generate AI-powered meeting summaries.
- Extract important key points.
- Identify meeting decisions.
- Generate action items.
- Save and view previous meeting records.
- Display meeting date and time.
- Download generated meeting minutes.

## Technologies Used
- **Python** – Backend programming
- **FastAPI** – REST API framework
- **Faster-Whisper** – Speech-to-text transcription
- **HTML, CSS, JavaScript** – Frontend
- **SQLite** – Meeting history storage

## Project Structure
```text
AI-Meeting-Minutes-Generator/
│
├── backend/
│   ├── main.py
│   ├── transcriber.py
│   ├── summarizer.py
│   └── database.py
│
├── frontend/
│   ├── index.html
│   ├── new-meeting.html
│   ├── meeting-history.html
│   ├── styles.css
│   └── app.js
│
├── requirements.txt
├── README.md
├── Start_MeetMind_AI.bat
└── create_sample_audio.py
```

## Installation and Setup

1. Clone or download this repository.
2. Open Command Prompt in the project folder.
3. Create a virtual environment:

```bash
python -m venv venv
```

4. Activate the virtual environment:

```bash
venv\Scripts\activate
```

5. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Project

Start the backend:

```bash
python -m uvicorn backend.main:app --reload
```

Open another Command Prompt and start the frontend:

```bash
cd frontend
python -m http.server 5500
```

Open the application in your browser:

`http://127.0.0.1:5500`

Backend API documentation:

`http://127.0.0.1:8000/docs`

## Project Purpose
The purpose of MeetMind AI is to automate meeting documentation by converting audio conversations into organized meeting summaries, decisions, and action items.

## Developed As
AI Internship Project

