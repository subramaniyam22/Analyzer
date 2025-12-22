from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

# Lazy client initialization - only create when actually needed
_client_instance = None

def get_openai_client():
    """Factory function to get OpenAI client. Creates it lazily on first call."""
    global _client_instance
    if _client_instance is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client_instance = OpenAI(api_key=api_key)
    return _client_instance

# For backward compatibility, create a property-like access
class _ClientProxy:
    def __getattr__(self, name):
        return getattr(get_openai_client(), name)

openai_client = _ClientProxy()
