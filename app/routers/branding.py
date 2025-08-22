from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from .. import crud, schemas, security, models
from ..database import get_db
from ..services.file_upload import FileUploadService

router = APIRouter()

@router.get("/", response_model=schemas.Tenant)
def get_tenant_branding(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get current tenant's branding information"""
    tenant = crud.get_tenant_branding(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/", response_model=schemas.Tenant)
def update_tenant_branding(
    branding_data: schemas.TenantBrandingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Update tenant branding information"""
    updated_tenant = crud.update_tenant_branding(
        db, 
        tenant_id=current_user.tenant_id, 
        branding_data=branding_data
    )
    if not updated_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return updated_tenant

@router.post("/logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload company logo"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save logo using existing file upload service
        result = await FileUploadService.save_company_logo(file, current_user.tenant_id)
        
        # Update tenant with logo information
        branding_data = schemas.TenantBrandingUpdate(
            company_logo_url=result["image_url"],
            company_logo_filename=result["image_filename"]
        )
        
        updated_tenant = crud.update_tenant_branding(
            db, 
            tenant_id=current_user.tenant_id, 
            branding_data=branding_data
        )
        
        return {
            "success": True,
            "logo_url": result["image_url"],
            "filename": result["image_filename"],
            "message": "Logo uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/logo")
def remove_company_logo(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Remove company logo"""
    branding_data = schemas.TenantBrandingUpdate(
        company_logo_url=None,
        company_logo_filename=None
    )
    
    updated_tenant = crud.update_tenant_branding(
        db, 
        tenant_id=current_user.tenant_id, 
        branding_data=branding_data
    )
    
    return {
        "success": True,
        "message": "Logo removed successfully"
    }