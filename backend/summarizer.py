
import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"


def summarize_meeting(transcript):

    if not transcript or not transcript.strip():
        raise ValueError("Meeting transcript is empty.")

    prompt = f"""
You are a professional meeting minutes assistant.

Analyze the following meeting transcript.

Generate accurate and concise meeting minutes.

Return ONLY valid JSON using this structure:

{{
    "meeting_title": "Suitable meeting title",
    "summary": "Brief meeting summary",
    "key_points": [
        "Important discussion point"
    ],
    "decisions": [
        "Decision made during the meeting"
    ],
    "action_items": [
        {{
            "task": "Task description",
            "responsible_person": "Person's name or Not specified",
            "deadline": "Deadline or Not specified"
        }}
    ],
    "conclusion": "Meeting conclusion"
}}

IMPORTANT:
- Do not invent information.
- Do not create decisions that were not discussed.
- Do not assign tasks to people without evidence.
- If information is unavailable, use "Not specified".
- Keep the summary concise and professional.

MEETING TRANSCRIPT:

{transcript}
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=300
        )

        response.raise_for_status()

        result = response.json()
        generated_text = result["response"]

        meeting_minutes = json.loads(generated_text)

        return meeting_minutes

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Ollama is not running. Please start Ollama."
        )

    except requests.exceptions.Timeout:
        raise RuntimeError(
            "AI summarization timed out. Try a shorter transcript."
        )

    except requests.exceptions.RequestException as error:
        raise RuntimeError(f"Ollama API error: {error}")

    except (KeyError, json.JSONDecodeError):
        raise RuntimeError(
            "AI returned an invalid meeting minutes format."
        )
