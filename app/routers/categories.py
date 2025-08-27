from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Category])
def get_categories(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get all categories for the current user's tenant.
    """
    categories = crud.get_categories_by_tenant(db, tenant_id=current_user.tenant_id, active_only=active_only)
    return categories

@router.post("/", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Create a new category for the current user's tenant.
    """
    # Check if category name already exists for this tenant
    existing = db.query(models.Category).filter(
        models.Category.name == category.name,
        models.Category.tenant_id == current_user.tenant_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Category with this name already exists"
        )
    
    return crud.create_category(db=db, category=category, tenant_id=current_user.tenant_id)

@router.get("/{category_id}", response_model=schemas.Category)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get a specific category by ID.
    """
    category = crud.get_category_by_id(db, category_id=category_id, tenant_id=current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Update a category.
    """
    # Check if new name conflicts with existing category
    if category_update.name:
        existing = db.query(models.Category).filter(
            models.Category.name == category_update.name,
            models.Category.tenant_id == current_user.tenant_id,
            models.Category.id != category_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Category with this name already exists"
            )
    
    category = crud.update_category(
        db, 
        category_id=category_id, 
        category_update=category_update, 
        tenant_id=current_user.tenant_id
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Delete a category. If products use this category, it will be deactivated instead.
    """
    result = crud.delete_category(db, category_id=category_id, tenant_id=current_user.tenant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {
        "message": "Category deactivated (has products)" if result["deactivated"] else "Category deleted",
        "deleted": result["deleted"],
        "deactivated": result["deactivated"],
        "products_affected": result["products_count"]
    }

@router.post("/initialize-defaults")
def initialize_default_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Initialize default categories for the tenant if they don't have any.
    """
    existing_count = db.query(models.Category).filter(
        models.Category.tenant_id == current_user.tenant_id
    ).count()
    
    if existing_count == 0:
        crud.create_default_categories(db, current_user.tenant_id)
        return {"message": "Default categories created successfully"}
    else:
        return {"message": f"Tenant already has {existing_count} categories"}

@router.put("/{category_id}/reorder")
def reorder_category(
    category_id: int,
    new_order: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Update the sort order of a category.
    """
    category = crud.get_category_by_id(db, category_id, current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.sort_order = new_order
    db.commit()
    db.refresh(category)
    
    return {"message": "Category order updated", "category": category}