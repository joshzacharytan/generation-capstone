from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get all orders for the current user's tenant.
    Only accessible to authenticated admin users.
    """
    orders = crud.get_orders_by_tenant(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)
    return orders

@router.get("/{order_id}", response_model=schemas.Order)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get a specific order by ID.
    Only accessible to authenticated admin users who own the order.
    """
    order = crud.get_order_by_id(db, order_id=order_id, tenant_id=current_user.tenant_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=schemas.Order)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Update order status.
    Only accessible to authenticated admin users who own the order.
    """
    order = crud.update_order_status(
        db, 
        order_id=order_id, 
        status=status_update.status, 
        tenant_id=current_user.tenant_id
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order