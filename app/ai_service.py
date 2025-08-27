import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from typing import Optional
import time

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

def generate_product_description(product_name: str, keywords: list[str], timeout: int = 15) -> str:
    """
    Generates a product description using the Gemini API with timeout handling.
    
    Args:
        product_name: The name of the product
        keywords: List of keywords to include in the description
        timeout: Timeout in seconds (default: 15)
    
    Returns:
        Generated product description or fallback description on timeout/error
    """
    start_time = time.time()
    
    try:
        keyword_string = ", ".join(keywords)
        prompt_parts = [
            f"Write ONE single, compelling and concise e-commerce product description for the following product. "
            f"Do not provide multiple options or suggestions. Return only the final description without any prefixes, numbering, or alternatives.\n\n",
            f"Product Name: {product_name}\n",
            f"Keywords to include: {keyword_string}\n\n",
            "Provide only the product description (2-3 sentences maximum):",
        ]

        # Add request timeout to generation config
        model_with_timeout = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Generate content - let Gemini handle its own internal timeouts
        # The timeout parameter is primarily for our tracking and logging
        response = model_with_timeout.generate_content(prompt_parts)
        
        # Check if the response took too long (soft timeout check)
        elapsed_time = time.time() - start_time
        if elapsed_time > timeout:
            logging.warning(f"AI service took {elapsed_time:.2f}s (longer than {timeout}s timeout) for product: {product_name}")
            # Don't fail, but log the slow response
        
        # Check if response is valid
        if not response or not hasattr(response, 'text') or not response.text:
            logging.warning(f"Empty or invalid response from Gemini API for product: {product_name}")
            return _get_fallback_description(product_name, keywords)
        
        # Post-process the response to ensure only one description
        description = response.text.strip()
        
        # If the AI still provides multiple options (numbered lists, bullet points, etc.)
        # Take only the first one
        lines = description.split('\n')
        first_description = ""
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith(('1.', '2.', '3.', '-', '*', '•')):
                first_description = line
                break
            elif line and line.startswith(('1.', '-', '*', '•')):
                # Remove numbering/bullet formatting and take the first option
                first_description = line.lstrip('1234567890.-*• ').strip()
                break
        
        # If no valid description found, return the first non-empty line
        if not first_description:
            for line in lines:
                if line.strip():
                    first_description = line.strip()
                    break
        
        final_description = first_description if first_description else description
        
        # Log successful generation time
        elapsed_time = time.time() - start_time
        logging.info(f"AI description generated successfully in {elapsed_time:.2f}s for product: {product_name}")
        
        return final_description
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        error_msg = str(e).lower()
        
        # Specific error handling based on error type
        if 'timeout' in error_msg or 'deadline' in error_msg:
            logging.error(f"AI service timeout after {elapsed_time:.2f}s for product: {product_name}")
            return _get_fallback_description(product_name, keywords, "Service temporarily unavailable due to high demand. Please try again.")
        elif 'quota' in error_msg or 'rate limit' in error_msg:
            logging.error(f"AI service rate limit exceeded for product: {product_name}")
            return _get_fallback_description(product_name, keywords, "AI service temporarily unavailable. Please try again later.")
        elif 'api key' in error_msg or 'authentication' in error_msg:
            logging.error(f"AI service authentication error: {e}")
            return _get_fallback_description(product_name, keywords, "AI service configuration error. Please contact support.")
        else:
            logging.error(f"Unexpected AI service error after {elapsed_time:.2f}s for product {product_name}: {e}")
            return _get_fallback_description(product_name, keywords)


def _get_fallback_description(product_name: str, keywords: list[str], custom_message: Optional[str] = None) -> str:
    """
    Generate a fallback description when AI service fails.
    
    Args:
        product_name: The name of the product
        keywords: List of keywords to include
        custom_message: Custom error message to include
    
    Returns:
        A basic fallback description
    """
    if custom_message:
        return f"Description temporarily unavailable. {custom_message}"
    
    # Create a basic description from the product name and keywords
    if keywords:
        keyword_phrase = ", ".join(keywords[:3])  # Use first 3 keywords
        return f"{product_name} - A quality product featuring {keyword_phrase}. Contact us for more details."
    else:
        return f"{product_name} - A quality product. Contact us for more details."

