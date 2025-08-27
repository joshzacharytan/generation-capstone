from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, or_
import sqlalchemy as sa
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Order])
def get_orders(
    request: Request,
    skip: int = 0,
    limit: int = 15,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
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
    request: Request,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
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

@router.get("/analytics/overview")
def get_sales_overview(
    request: Request,
    days: int = 30,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get sales overview analytics for the dashboard.
    Only accessible to authenticated admin users.
    """
    from_date = datetime.now() - timedelta(days=days)
    
    if category_id:
        # Get category name for fallback to string-based filtering
        category = db.query(models.Category).filter(
            models.Category.id == category_id,
            models.Category.tenant_id == current_user.tenant_id
        ).first()
        
        if not category:
            # Invalid category ID
            return {
                "total_revenue": 0.0,
                "total_orders": 0,
                "average_order_value": 0.0,
                "revenue_growth_percentage": 0.0,
                "status_distribution": [],
                "period_days": days
            }
        
        # Category-specific analytics using both category_id and category name
        revenue_query = db.query(
            func.sum(models.Order.total_amount).label('total_revenue'),
            func.count(models.Order.id).label('total_orders')
        ).join(
            models.OrderItem, models.Order.id == models.OrderItem.order_id
        ).join(
            models.Product, models.OrderItem.product_id == models.Product.id
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.status != models.OrderStatus.CANCELLED,
            models.Order.created_at >= from_date,
            or_(
                models.Product.category_id == category_id,
                models.Product.category == category.name
            )
        ).first()
        
        total_revenue = float(revenue_query.total_revenue or 0)
        total_orders = revenue_query.total_orders or 0
        
        # Status distribution for category
        status_distribution = db.query(
            models.Order.status,
            func.count(models.Order.id).label('count'),
            func.sum(models.Order.total_amount).label('total_value')
        ).join(
            models.OrderItem, models.Order.id == models.OrderItem.order_id
        ).join(
            models.Product, models.OrderItem.product_id == models.Product.id
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.created_at >= from_date,
            or_(
                models.Product.category_id == category_id,
                models.Product.category == category.name
            )
        ).group_by(models.Order.status).all()
        
        # Previous period for category
        prev_from_date = from_date - timedelta(days=days)
        prev_revenue_query = db.query(
            func.sum(models.Order.total_amount)
        ).join(
            models.OrderItem, models.Order.id == models.OrderItem.order_id
        ).join(
            models.Product, models.OrderItem.product_id == models.Product.id
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.status != models.OrderStatus.CANCELLED,
            models.Order.created_at >= prev_from_date,
            models.Order.created_at < from_date,
            or_(
                models.Product.category_id == category_id,
                models.Product.category == category.name
            )
        ).scalar()
        
    else:
        # All categories analytics
        revenue_query = db.query(
            func.sum(models.Order.total_amount).label('total_revenue'),
            func.count(models.Order.id).label('total_orders')
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.status != models.OrderStatus.CANCELLED,
            models.Order.created_at >= from_date
        ).first()
        
        total_revenue = float(revenue_query.total_revenue or 0)
        total_orders = revenue_query.total_orders or 0
        
        # Status distribution for all
        status_distribution = db.query(
            models.Order.status,
            func.count(models.Order.id).label('count'),
            func.sum(models.Order.total_amount).label('total_value')
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.created_at >= from_date
        ).group_by(models.Order.status).all()
        
        # Previous period for all
        prev_from_date = from_date - timedelta(days=days)
        prev_revenue_query = db.query(
            func.sum(models.Order.total_amount)
        ).filter(
            models.Order.tenant_id == current_user.tenant_id,
            models.Order.status != models.OrderStatus.CANCELLED,
            models.Order.created_at >= prev_from_date,
            models.Order.created_at < from_date
        ).scalar()
    
    # Calculate metrics
    avg_order_value = float(total_revenue / total_orders) if total_orders > 0 else 0
    prev_revenue = float(prev_revenue_query or 0)
    revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    
    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "average_order_value": avg_order_value,
        "revenue_growth_percentage": revenue_growth,
        "status_distribution": [
            {
                "status": status.status,
                "count": status.count,
                "total_value": float(status.total_value or 0)
            }
            for status in status_distribution
        ],
        "period_days": days
    }

@router.get("/analytics/revenue-trend")
def get_revenue_trend(
    request: Request,
    days: int = 30,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get daily revenue trend data for charts.
    Only accessible to authenticated admin users.
    """
    from_date = datetime.now() - timedelta(days=days)
    
    # Base query
    query = db.query(
        func.date(models.Order.created_at).label('date'),
        func.sum(models.Order.total_amount).label('revenue'),
        func.count(models.Order.id).label('order_count')
    ).filter(
        models.Order.tenant_id == current_user.tenant_id,
        models.Order.status != models.OrderStatus.CANCELLED,
        models.Order.created_at >= from_date
    )
    
    # Add category filter if specified
    if category_id:
        # Get category name for fallback filtering
        category = db.query(models.Category).filter(
            models.Category.id == category_id,
            models.Category.tenant_id == current_user.tenant_id
        ).first()
        
        if category:
            query = query.join(models.OrderItem).join(models.Product).filter(
                or_(
                    models.Product.category_id == category_id,
                    models.Product.category == category.name
                )
            )
    
    daily_revenue = query.group_by(func.date(models.Order.created_at)).order_by('date').all()
    
    return [
        {
            "date": day.date.isoformat(),
            "revenue": float(day.revenue or 0),
            "order_count": day.order_count
        }
        for day in daily_revenue
    ]

@router.get("/analytics/top-products")
def get_top_products(
    request: Request,
    limit: int = 10,
    days: int = 30,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get top-selling products by revenue and quantity.
    Only accessible to authenticated admin users.
    """
    from_date = datetime.now() - timedelta(days=days)
    
    # Base query for top products
    query = db.query(
        models.Product.id,
        models.Product.name,
        func.sum(models.OrderItem.total_price).label('total_revenue'),
        func.sum(models.OrderItem.quantity).label('total_quantity'),
        func.count(models.OrderItem.id).label('order_count')
    ).join(
        models.OrderItem, models.Product.id == models.OrderItem.product_id
    ).join(
        models.Order, models.OrderItem.order_id == models.Order.id
    ).filter(
        models.Product.tenant_id == current_user.tenant_id,
        models.Order.status != models.OrderStatus.CANCELLED,
        models.Order.created_at >= from_date
    )
    
    # Add category filter if specified
    if category_id:
        # Get category name for fallback filtering
        category = db.query(models.Category).filter(
            models.Category.id == category_id,
            models.Category.tenant_id == current_user.tenant_id
        ).first()
        
        if category:
            query = query.filter(
                or_(
                    models.Product.category_id == category_id,
                    models.Product.category == category.name
                )
            )
    
    top_products = query.group_by(
        models.Product.id, models.Product.name
    ).order_by(
        desc('total_revenue')
    ).limit(limit).all()
    
    return [
        {
            "product_id": product.id,
            "product_name": product.name,
            "total_revenue": float(product.total_revenue or 0),
            "total_quantity": product.total_quantity,
            "order_count": product.order_count,
            "average_price": float(product.total_revenue / product.total_quantity) if product.total_quantity > 0 else 0
        }
        for product in top_products
    ]

@router.put("/{order_id}/status", response_model=schemas.Order)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
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

@router.get("/{order_id}", response_model=schemas.Order)
def get_order(
    order_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user_alternative)
):
    """
    Get a specific order by ID.
    Only accessible to authenticated admin users who own the order.
    """
    order = crud.get_order_by_id(db, order_id=order_id, tenant_id=current_user.tenant_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order