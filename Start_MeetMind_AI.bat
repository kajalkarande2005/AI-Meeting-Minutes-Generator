@echo off
title MeetMind AI Launcher
echo ==========================================
echo       Starting MeetMind AI
echo ==========================================
echo.

start "MeetMind AI Backend" cmd /k "cd /d ""C:\Users\User\Documents\MY PROJECTS\AI-Meeting-Minutes-Generator"" && call venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload"

start "MeetMind AI Frontend" cmd /k "cd /d ""C:\Users\User\Documents\MY PROJECTS\AI-Meeting-Minutes-Generator\frontend"" && python -m http.server 5500"

timeout /t 5 /nobreak >nul
start "" "http://127.0.0.1:5500"

echo.
echo MeetMind AI is starting in your browser.
echo Keep both server windows open while using the project.
echo You can close this launcher window.
exit
