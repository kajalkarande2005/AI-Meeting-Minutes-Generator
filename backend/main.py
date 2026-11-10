
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.transcriber import transcribe_audio
from backend.summarizer import summarize_meeting
from backend.database import (
    initialize_database,
    save_meeting,
    get_all_meetings,
    get_meeting_by_id
)

app = FastAPI(
    title="AI Meeting Minutes Generator",
    description="AI-powered meeting transcription and summarization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".webm"
}

MAX_FILE_SIZE = 100 * 1024 * 1024


@app.on_event("startup")
def startup_event():
    initialize_database()


@app.get("/")
def home():
    return {
        "message": "AI Meeting Minutes Generator API is running!",
        "status": "active"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "application": "AI Meeting Minutes Generator"
    }


@app.post("/process-meeting")
async def process_meeting(file: UploadFile = File(...)):

    filename = os.path.basename(file.filename or "")
    extension = os.path.splitext(filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format."
        )

    file_path = None

    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        import tempfile

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
            dir=UPLOAD_DIR
        ) as temp_file:

            file_path = temp_file.name
            total_size = 0

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File size exceeds 100 MB."
                    )

                temp_file.write(chunk)

        if total_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        # Step 1: Transcribe audio
        transcription = transcribe_audio(file_path)

        transcript = transcription["transcript"]

        if not transcript.strip():
            raise HTTPException(
                status_code=422,
                detail="No speech detected in the audio."
            )

        # Step 2: Generate meeting minutes
        minutes = summarize_meeting(transcript)

        # Step 3: Save meeting
        meeting_id = save_meeting(
            transcript,
            minutes,
            transcription["language"]
        )

        # Step 4: Retrieve saved meeting date and time
        saved_meeting = get_meeting_by_id(meeting_id)

        return {
            "success": True,
            "meeting_id": meeting_id,
            "created_at": saved_meeting["created_at"] if saved_meeting else None,
            "transcript": transcript,
            "language": transcription["language"],
            "language_probability": transcription["language_probability"],
            "minutes": minutes
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        await file.close()

        if file_path and os.path.exists(file_path):
            os.remove(file_path)


@app.get("/meetings")
def meetings_history():
    return {
        "meetings": get_all_meetings()
    }


@app.get("/meetings/{meeting_id}")
def meeting_details(meeting_id: int):

    meeting = get_meeting_by_id(meeting_id)

    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found."
        )

    return meeting
