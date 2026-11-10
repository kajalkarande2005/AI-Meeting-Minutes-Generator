
from faster_whisper import WhisperModel
import os

# Load the speech recognition model
_model = None

def get_model():
    global _model

    if _model is None:
        print("Loading Faster-Whisper model...")

        _model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8"
        )

        print("Whisper model loaded successfully!")

    return _model


def transcribe_audio(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError("Audio file not found.")

    model = get_model()

    segments, info = model.transcribe(
        file_path,
        beam_size=5,
        vad_filter=True
    )

    transcript_parts = []

    for segment in segments:
        text = segment.text.strip()

        if text:
            transcript_parts.append(text)

    transcript = " ".join(transcript_parts)

    return {
        "transcript": transcript,
        "language": info.language,
        "language_probability": round(
            info.language_probability, 3
        )
    }
