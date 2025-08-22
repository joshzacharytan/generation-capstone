from fastapi import APIRouter, Depends

from .. import schemas, security, models, ai_service

router = APIRouter()

@router.post("/generate-description", response_model=schemas.DescriptionResponse)
def get_ai_description(
    request: schemas.DescriptionRequest,
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Generates a product description using the AI service.
    Only accessible to authenticated users.
    """
    description = ai_service.generate_product_description(
        product_name=request.product_name,
        keywords=request.keywords
    )
    return schemas.DescriptionResponse(description=description)
