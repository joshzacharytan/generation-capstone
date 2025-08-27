from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
import logging

from .. import schemas, security, models, ai_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate-description", response_model=schemas.DescriptionResponse)
def get_ai_description(
    description_request: schemas.DescriptionRequest,
    request: Request,
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Generates a product description using the AI service.
    Only accessible to authenticated users.
    
    Returns:
        DescriptionResponse with the generated description or error message
    """
    try:
        logger.info(f"AI description request from user {current_user.email} for product: {description_request.product_name}")
        
        # Validate input
        if not description_request.product_name or not description_request.product_name.strip():
            raise HTTPException(
                status_code=400,
                detail="Product name is required and cannot be empty"
            )
        
        # Generate description with timeout (15 seconds)
        description = ai_service.generate_product_description(
            product_name=description_request.product_name.strip(),
            keywords=description_request.keywords or [],
            timeout=15  # 15 second timeout
        )
        
        # Check if the description indicates an error
        if description.startswith("Error:") or description.startswith("Description temporarily unavailable"):
            logger.warning(f"AI service returned error message for user {current_user.email}: {description}")
            
            # Return the error as a valid response but with indication it's an error
            return schemas.DescriptionResponse(
                description=description,
                success=False,
                error_type="service_error"
            )
        
        logger.info(f"AI description generated successfully for user {current_user.email}")
        return schemas.DescriptionResponse(
            description=description,
            success=True
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in AI description endpoint for user {current_user.email}: {str(e)}")
        
        # Return a generic error message
        return schemas.DescriptionResponse(
            description="Unable to generate description at this time. Please try again or enter manually.",
            success=False,
            error_type="unexpected_error"
        )
