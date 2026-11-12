import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ProductExtraction


# Load .env from LegalMet root directory
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def extract_product_details(image_bytes: bytes, content_type: str):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found in .env")

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    client = genai.Client(api_key=api_key)

    prompt = """
    You are an image-based packaged commodity text extraction assistant.

    Examine the provided product package image carefully.

    Extract the visible product information using the provided JSON schema.

    Instructions:
    1. Extract only information actually visible in the image.
    2. Do not guess or invent missing information.
    3. If a field is not visible or cannot be read, return null.
    4. Preserve the original wording, numbers and units wherever possible.
    5. Do not perform legal compliance evaluation.
    6. Include other relevant visible declarations in the
       other_visible_declarations field.
    """

    response = client.models.generate_content(
        model=model,
        contents=[
            prompt,
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=content_type
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ProductExtraction,
            temperature=0
        )
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    extracted_data = ProductExtraction.model_validate_json(
        response.text
    )

    return extracted_data