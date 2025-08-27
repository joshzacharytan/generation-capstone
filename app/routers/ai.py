from fastapi import APIRouter, Depends, Request

from .. import schemas, security, models, ai_service

router = APIRouter()

@router.post("/generate-description", response_model=schemas.DescriptionResponse)
def get_ai_description(
    description_request: schemas.DescriptionRequest,
    request: Request,
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Generates a product description using the AI service.
    Only accessible to authenticated users.
    """
    description = ai_service.generate_product_description(
        product_name=description_request.product_name,
        keywords=description_request.keywords
    )
    return schemas.DescriptionResponse(description=description)
