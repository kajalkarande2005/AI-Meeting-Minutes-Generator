import pyttsx3
import os

engine = pyttsx3.init()

engine.setProperty("rate", 145)
engine.setProperty("volume", 1.0)

meeting_script = """
Speaker 1: Good morning everyone.
Today we will discuss our website development project.

Speaker 2: We have completed the homepage design.
The remaining task is backend integration.

Speaker 1: Let's complete backend integration by Friday.

Speaker 3: I will handle the database connection and testing.

Speaker 2: I will complete the login page by Wednesday.

Speaker 1: We will review the project progress next Monday.

Speaker 3: Agreed. Thank you everyone.
"""

os.makedirs("uploads", exist_ok=True)

output_file = os.path.join("uploads", "sample_meeting.wav")

engine.save_to_file(meeting_script, output_file)
engine.runAndWait()

print("Sample meeting audio created successfully!")
print("File location:", output_file)