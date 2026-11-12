
import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ProductExtraction, RuleEvaluationResponse


# Load .env from LegalMet root directory
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


def evaluate_product_rules(
    extracted_data: ProductExtraction,
    retrieved_rules: list[dict]
):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found in .env")

    model = os.getenv("GEMINI_MODEL", "gemini-3.5 Flash-Lite")

    client = genai.Client(api_key=api_key)

    product_data = extracted_data.model_dump()
    rules_data = retrieved_rules

    prompt = f"""
    You are a Legal Metrology packaged commodity rule
    evaluation assistant.

    Your task is to evaluate the extracted product information
    against the supplied legal rules.

    PRODUCT INFORMATION:
    {json.dumps(product_data, ensure_ascii=False)}

    RULES TO EVALUATE:
    {json.dumps(rules_data, ensure_ascii=False)}

    INSTRUCTIONS:
    1. Evaluate every supplied rule individually.
    2. Use only the supplied rule text and product information.
    3. Do not invent legal requirements.
    4. Return PASS when available evidence demonstrates compliance.
    5. Return FAIL when available evidence demonstrates a violation.
    6. Return UNABLE_TO_VERIFY when information is insufficient.
    7. Missing or unreadable OCR fields must not automatically
       be treated as violations.
    8. For conditional rules, if applicability cannot be established,
       return UNABLE_TO_VERIFY.
    9. Preserve the original r_id for every evaluation.
    10. Evaluate all supplied rules, including non-mandatory rules.
    11. Give a clear reason for every result.
    12. Include supporting extracted information in evidence.
        If no evidence exists, return null.
    13. Return exactly one evaluation for every supplied rule.

    Follow the provided JSON response schema.
    """

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RuleEvaluationResponse,
            temperature=0
        )
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    evaluation = RuleEvaluationResponse.model_validate_json(
        response.text
    )

    return evaluation
