from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Order])
def get_orders(
    skip: int = 0,
    limit: int = 15,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get all orders for the current user's tenant with pagination and filtering.
    Only accessible to authenticated admin users.
    """
    from datetime import datetime
    
    query = db.query(models.Order).filter(
        models.Order.tenant_id == current_user.tenant_id
    )
    
    # Apply status filter
    if status and status.lower() != 'all':
        query = query.filter(models.Order.status == status.lower())
    
    # Apply search filter (order number or customer info)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(models.Customer).filter(
            models.Order.order_number.ilike(search_term) |
            models.Customer.first_name.ilike(search_term) |
            models.Customer.last_name.ilike(search_term) |
            models.Customer.email.ilike(search_term)
        )
    
    # Apply date filters
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at <= to_date)
        except ValueError:
            pass
    
    orders = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders

@router.get("/count")
def get_orders_count(
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Get total count of orders for the current tenant for pagination.
    Only accessible to authenticated admin users.
    """
    from datetime import datetime
    
    query = db.query(models.Order).filter(
        models.Order.tenant_id == current_user.tenant_id
    )
    
    # Apply same filters as main orders endpoint
    if status and status.lower() != 'all':
        query = query.filter(models.Order.status == status.lower())
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.join(models.Customer).filter(
            models.Order.order_number.ilike(search_term) |
            models.Customer.first_name.ilike(search_term) |
            models.Customer.last_name.ilike(search_term) |
            models.Customer.email.ilike(search_term)
        )
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at <= to_date)
        except ValueError:
            pass
    
    total_count = query.count()
    return {"total": total_count}

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