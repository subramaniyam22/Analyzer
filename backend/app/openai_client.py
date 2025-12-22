from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Robust client initialization (prevents startup crash if key is missing)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    # Use a placeholder logging-only client or handle at usage site
    # This prevents the "OpenAIError: The api_key client option must be set" during build/startup
    openai_client = OpenAI(api_key="missing_key_placeholder")
else:
    openai_client = OpenAI(api_key=api_key)
