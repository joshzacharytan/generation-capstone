from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, security, models
from ..database import get_db
from ..services.file_upload import FileUploadService

router = APIRouter()

# Dependency for tenant admin access
def get_tenant_admin_db(request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user_alternative)):
    return db, current_user

# Dependency for public store access
def get_public_db(db: Session = Depends(get_db)):
    return db

# --- Hero Banner Management (Admin) ---

@router.get("/", response_model=List[schemas.HeroBanner])
def get_hero_banners(
    active_only: bool = False,
    db_and_user = Depends(get_tenant_admin_db)
):
    """
    Get all hero banners for the current tenant.
    Accessible only by Tenant Admins.
    """
    db, current_user = db_and_user
    banners = crud.get_hero_banners_by_tenant(db, current_user.tenant_id, active_only=active_only)
    return banners

@router.get("/{banner_id}", response_model=schemas.HeroBanner)
def get_hero_banner(
    banner_id: int,
    db_and_user = Depends(get_tenant_admin_db)
):
    """
    Get a specific hero banner by ID.
    Accessible only by Tenant Admins.
    """
    db, current_user = db_and_user
    banner = crud.get_hero_banner_by_id(db, banner_id, current_user.tenant_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Hero banner not found")
    return banner

@router.post("/", response_model=schemas.HeroBanner, status_code=status.HTTP_201_CREATED)
async def create_hero_banner(
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    link_text: Optional[str] = Form(None),
    is_active: bool = Form(True),
    show_title: bool = Form(False),
    sort_order: int = Form(0),
    rotation_interval: int = Form(5),
    image: UploadFile = File(...),
    db_and_user = Depends(get_tenant_admin_db)
):
    """
    Create a new hero banner with image upload.
    Accessible only by Tenant Admins.
    """
    db, current_user = db_and_user
    
    try:
        # Upload the banner image
        upload_result = await FileUploadService.save_hero_banner(image, current_user.tenant_id)
        
        # Create banner data
        banner_data = schemas.HeroBannerCreate(
            title=title,
            subtitle=subtitle,
            image_url=upload_result["image_url"],
            image_filename=upload_result["image_filename"],
            link_url=link_url,
            link_text=link_text,
            is_active=is_active,
            show_title=show_title,
            sort_order=sort_order,
            rotation_interval=rotation_interval
        )
        
        # Create banner in database
        banner = crud.create_hero_banner(db, banner_data, current_user.tenant_id)
        
        return banner
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create hero banner: {str(e)}")

@router.put("/{banner_id}", response_model=schemas.HeroBanner)
async def update_hero_banner(
    banner_id: int,
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    link_text: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    show_title: Optional[bool] = Form(None),
    sort_order: Optional[int] = Form(None),
    rotation_interval: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db_and_user = Depends(get_tenant_admin_db)
):
    """
    Update a hero banner. If image is provided, replaces the existing image.
    Accessible only by Tenant Admins.
    """
    db, current_user = db_and_user
    
    # Check if banner exists
    existing_banner = crud.get_hero_banner_by_id(db, banner_id, current_user.tenant_id)
    if not existing_banner:
        raise HTTPException(status_code=404, detail="Hero banner not found")
    
    try:
        # Prepare update data
        update_data = {}
        
        if title is not None:
            update_data["title"] = title
        if subtitle is not None:
            update_data["subtitle"] = subtitle
        if link_url is not None:
            update_data["link_url"] = link_url
        if link_text is not None:
            update_data["link_text"] = link_text
        if is_active is not None:
            update_data["is_active"] = is_active
        if show_title is not None:
            update_data["show_title"] = show_title
        if sort_order is not None:
            update_data["sort_order"] = sort_order
        if rotation_interval is not None:
            update_data["rotation_interval"] = rotation_interval
        
        # Handle image upload if provided
        if image and image.filename:
            # Delete old image
            if existing_banner.image_url:  # type: ignore
                FileUploadService.delete_hero_banner(str(existing_banner.image_url), current_user.tenant_id)
            
            # Upload new image
            upload_result = await FileUploadService.save_hero_banner(image, current_user.tenant_id)
            update_data["image_url"] = upload_result["image_url"]
            update_data["image_filename"] = upload_result["image_filename"]
        
        # Update banner
        banner_update = schemas.HeroBannerUpdate(**update_data)
        updated_banner = crud.update_hero_banner(db, banner_id, banner_update, current_user.tenant_id)
        
        return updated_banner
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update hero banner: {str(e)}")

@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hero_banner(
    banner_id: int,
    db_and_user = Depends(get_tenant_admin_db)
):
    """
    Delete a hero banner and its associated image.
    Accessible only by Tenant Admins.
    """
    db, current_user = db_and_user
    
    banner = crud.get_hero_banner_by_id(db, banner_id, current_user.tenant_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Hero banner not found")
    
    try:
        # Delete the image file
        if banner.image_url:  # type: ignore
            FileUploadService.delete_hero_banner(str(banner.image_url), current_user.tenant_id)
        
        # Delete banner from database
        crud.delete_hero_banner(db, banner_id, current_user.tenant_id)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete hero banner: {str(e)}")

# --- Public Store API ---

@router.get("/public/{tenant_domain}", response_model=List[schemas.HeroBanner])
def get_public_hero_banners(
    tenant_domain: str,
    db: Session = Depends(get_public_db)
):
    """
    Get active hero banners for a store's public display.
    Public endpoint for customer storefront.
    """
    # Get tenant by domain
    tenant = crud.get_tenant_by_domain(db, tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get active banners only
    banners = crud.get_hero_banners_by_tenant(db, int(tenant.id), active_only=True)
    return banners