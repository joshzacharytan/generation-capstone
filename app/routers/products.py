from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, security, models
from ..database import get_db
from ..services.file_upload import FileUploadService

router = APIRouter()

@router.post("/products", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Create a new product for the current user's tenant.
    Only accessible to authenticated users.
    """
    return crud.create_product_for_tenant(db=db, product=product, tenant_id=current_user.tenant_id)

@router.get("/products", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    stock_filter: Optional[str] = None,  # all, in-stock, low-stock, out-of-stock
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "name",  # name, price, stock, date
    sort_order: Optional[str] = "asc",  # asc, desc
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Retrieve products for the current user's tenant with advanced filtering and search.
    Only accessible to authenticated users.
    """
    products = crud.get_products_with_filters(
        db=db,
        tenant_id=current_user.tenant_id,
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        stock_filter=stock_filter,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return products

@router.get("/products/analytics", response_model=dict)
def get_product_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get product analytics and smart suggestions for the admin dashboard.
    """
    analytics = crud.get_product_analytics(db, tenant_id=current_user.tenant_id)
    return analytics

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Update an existing product for the current user's tenant.
    Only accessible to authenticated users who own the product.
    """
    db_product = crud.get_product_by_id(db, product_id=product_id) # Need to add get_product_by_id to crud.py
    if not db_product or db_product.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found or not owned by tenant")
    
    updated_product = crud.update_product(db, product_id=product_id, product_update=product_update)
    return updated_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Delete a product for the current user's tenant.
    Only accessible to authenticated users who own the product.
    """
    db_product = crud.get_product_by_id(db, product_id=product_id) # Need to add get_product_by_id to crud.py
    if not db_product or db_product.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found or not owned by tenant")
    
    crud.delete_product(db, product_id=product_id)
    return

@router.get("/products/categories", response_model=List[str])
def get_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get all unique categories for the current user's tenant.
    """
    categories = crud.get_categories_by_tenant(db, tenant_id=current_user.tenant_id)
    return categories

@router.get("/products/categories/suggestions", response_model=List[str])
def get_category_suggestions():
    """
    Get suggested categories for product creation.
    """
    from ..constants import DEFAULT_CATEGORIES
    return DEFAULT_CATEGORIES

@router.post("/products/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Upload a product image.
    Returns the image URL and filename for use in product creation/update.
    """
    try:
        result = await FileUploadService.save_product_image(file, current_user.tenant_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/products/create-with-image", response_model=schemas.Product)
async def create_product_with_image(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    quantity: int = Form(...),
    category: str = Form("General"),
    image: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new product with optional image upload.
    """
    image_url = None
    image_filename = None
    
    # Upload image if provided
    if image:
        try:
            upload_result = await FileUploadService.save_product_image(image, current_user.tenant_id)
            image_url = upload_result["image_url"]
            image_filename = upload_result["image_filename"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
    # Create product data
    product_data = schemas.ProductCreate(
        name=name,
        description=description,
        price=price,
        quantity=quantity,
        category=category,
        image_url=image_url,
        image_filename=image_filename
    )
    
    return crud.create_product_for_tenant(db=db, product=product_data, tenant_id=current_user.tenant_id)

