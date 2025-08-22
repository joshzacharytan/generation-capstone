from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.put("/password", response_model=schemas.User)
def update_password(
    password_update: schemas.UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if not security.verify_password(password_update.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    hashed_password = security.get_password_hash(password_update.new_password)
    updated_user = crud.update_user_password(db, current_user.id, hashed_password)
    return updated_user

@router.put("/email", response_model=schemas.User)
def update_email(
    email_update: schemas.UserEmailUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if crud.get_user_by_email(db, email=email_update.new_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    updated_user = crud.update_user_email(db, current_user.id, email_update.new_email)
    return updated_user

@router.get("/me", response_model=schemas.UserWithTenant)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get current user profile with tenant information"""
    return current_user

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    crud.delete_user_account(db, current_user.id)
    return
