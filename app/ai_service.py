import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=api_key)

# Set up the model
generation_config = {
  "temperature": 0.7,
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 256,
}

safety_settings = [
  {
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
]

model = genai.GenerativeModel(model_name="gemini-1.5-flash",
                              generation_config=generation_config,
                              safety_settings=safety_settings)

def generate_product_description(product_name: str, keywords: list[str]) -> str:
    """
    Generates a product description using the Gemini API.
    """
    try:
        keyword_string = ", ".join(keywords)
        prompt_parts = [
            f"Write a compelling and concise e-commerce product description for the following product.\n\n",
            f"Product Name: {product_name}\n",
            f"Keywords to include: {keyword_string}\n\n",
            "Description:",
        ]

        response = model.generate_content(prompt_parts)
        return response.text
    except Exception as e:
        # In a real app, you'd want more robust logging here
        print(f"Error generating description: {e}")
        return "Error: Could not generate a description at this time."

