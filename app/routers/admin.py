from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

# Dependency for Super Admin access
def get_super_admin_db(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    return db

# --- Tenant Management ---

@router.get("/tenants", response_model=List[schemas.Tenant])
def read_tenants(skip: int = 0, limit: int = 100, db: Session = Depends(get_super_admin_db)):
    """
    Retrieve a list of all tenants.
    Accessible only by Super Admins.
    """
    tenants = crud.get_all_tenants(db, skip=skip, limit=limit)
    return tenants

@router.get("/tenants/{tenant_id}", response_model=schemas.Tenant)
def read_tenant(tenant_id: int, db: Session = Depends(get_super_admin_db)):
    """
    Retrieve a specific tenant by ID.
    Accessible only by Super Admins.
    """
    db_tenant = crud.get_tenant_by_id(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant

@router.delete("/tenants/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: int, db: Session = Depends(get_super_admin_db)):
    """
    Delete a tenant by ID.
    Accessible only by Super Admins.
    """
    db_tenant = crud.delete_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return

# --- User Management (across all tenants) ---

@router.get("/users", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_super_admin_db)):
    """
    Retrieve a list of all users across all tenants.
    Accessible only by Super Admins.
    """
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return users

@router.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_super_admin_db)):
    """
    Retrieve a specific user by ID.
    Accessible only by Super Admins.
    """
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(user_id: int, role_update: schemas.UserRoleUpdate, db: Session = Depends(get_super_admin_db)):
    """
    Update a user's role.
    Accessible only by Super Admins.
    """
    db_user = crud.update_user_role(db, user_id=user_id, new_role=role_update.role)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
