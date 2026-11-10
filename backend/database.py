
import sqlite3
import json
import os
from datetime import datetime

DATABASE_PATH = os.path.join(
    "database",
    "meeting_minutes.db"
)


def get_connection():
    os.makedirs("database", exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_title TEXT NOT NULL,
            transcript TEXT NOT NULL,
            summary TEXT,
            key_points TEXT,
            decisions TEXT,
            action_items TEXT,
            conclusion TEXT,
            language TEXT,
            created_at TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()

    print("Meeting database initialized successfully!")


def save_meeting(transcript, minutes, language="unknown"):

    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO meetings (
            meeting_title,
            transcript,
            summary,
            key_points,
            decisions,
            action_items,
            conclusion,
            language,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        minutes.get("meeting_title", "Untitled Meeting"),
        transcript,
        minutes.get("summary", ""),
        json.dumps(minutes.get("key_points", [])),
        json.dumps(minutes.get("decisions", [])),
        json.dumps(minutes.get("action_items", [])),
        minutes.get("conclusion", ""),
        language,
        datetime.now().isoformat(timespec="seconds")
    ))

    meeting_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return meeting_id


def get_all_meetings():

    connection = get_connection()

    rows = connection.execute("""
        SELECT id, meeting_title, summary, language, created_at
        FROM meetings
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    return [dict(row) for row in rows]


def get_meeting_by_id(meeting_id):

    connection = get_connection()

    row = connection.execute("""
        SELECT * FROM meetings WHERE id = ?
    """, (meeting_id,)).fetchone()

    connection.close()

    if row is None:
        return None

    meeting = dict(row)

    meeting["key_points"] = json.loads(
        meeting["key_points"] or "[]"
    )

    meeting["decisions"] = json.loads(
        meeting["decisions"] or "[]"
    )

    meeting["action_items"] = json.loads(
        meeting["action_items"] or "[]"
    )

    return meeting
