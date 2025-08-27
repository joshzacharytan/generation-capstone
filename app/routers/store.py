from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .. import crud, schemas, security, models
from ..database import get_db

router = APIRouter()

# Customer authentication
@router.post("/auth/register", response_model=schemas.Customer)
def register_customer(
    customer: schemas.CustomerCreate,
    tenant_domain: str,
    db: Session = Depends(get_db)
):
    """Register a new customer for a specific tenant"""
    # Get tenant by name
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Check if customer already exists
    db_customer = crud.get_customer_by_email(db, email=customer.email, tenant_id=tenant.id)
    if db_customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_customer(db=db, customer=customer, tenant_id=tenant.id)

@router.post("/auth/login")
def login_customer(
    form_data: OAuth2PasswordRequestForm = Depends(),
    tenant_domain: str = None,
    db: Session = Depends(get_db)
):
    """Customer login"""
    # Get tenant
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Authenticate customer
    customer = crud.get_customer_by_email(db, email=form_data.username, tenant_id=tenant.id)
    if not customer or not security.verify_password(form_data.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token (you might want to create a separate customer token system)
    access_token = security.create_access_token(
        data={"sub": customer.email, "customer_id": customer.id, "tenant_id": tenant.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Store endpoints
@router.get("/{tenant_domain}/products", response_model=List[schemas.Product])
def get_store_products(
    tenant_domain: str,
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get products for a specific store"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get products, optionally filtered by category
    if category:
        products = db.query(models.Product).filter(
            models.Product.tenant_id == tenant.id,
            models.Product.category == category,
            models.Product.quantity > 0  # Only show in-stock items
        ).offset(skip).limit(limit).all()
    else:
        products = crud.get_products_by_tenant(db, tenant_id=tenant.id, skip=skip, limit=limit)
        # Filter to only in-stock items
        products = [p for p in products if p.quantity > 0]
    
    return products

@router.get("/{tenant_domain}/products/{product_id}", response_model=schemas.Product)
def get_store_product(
    tenant_domain: str,
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific product from a store"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    product = crud.get_product_by_id(db, product_id=product_id)
    if not product or product.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@router.get("/{tenant_domain}/categories", response_model=List[str])
def get_store_categories(
    tenant_domain: str,
    db: Session = Depends(get_db)
):
    """Get all categories for a store"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    categories = crud.get_categories_by_tenant(db, tenant_id=tenant.id)
    return [category.name for category in categories]

@router.get("/{tenant_domain}/customer/me", response_model=schemas.Customer)
def get_current_customer_profile(
    tenant_domain: str,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(security.get_current_customer)
):
    """Get current customer profile"""
    return current_customer

@router.get("/{tenant_domain}/customer/orders", response_model=List[schemas.Order])
def get_customer_orders(
    tenant_domain: str,
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(security.get_current_customer_alternative)
):
    """Get current customer's order history with pagination and filtering"""
    from datetime import datetime
    
    query = db.query(models.Order).filter(
        models.Order.customer_id == current_customer.id,
        models.Order.tenant_id == current_customer.tenant_id
    )
    
    # Apply status filter
    if status and status.lower() != 'all':
        query = query.filter(models.Order.status == status.lower())
    
    # Apply search filter (order number or customer name)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            models.Order.order_number.ilike(search_term)
        )
    
    # Apply date filters
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at >= from_date)
        except ValueError:
            pass  # Invalid date format, ignore filter
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(models.Order.created_at <= to_date)
        except ValueError:
            pass  # Invalid date format, ignore filter
    
    # Apply pagination and ordering
    orders = query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()
    return orders

@router.get("/{tenant_domain}/customer/orders/count")
def get_customer_orders_count(
    tenant_domain: str,
    request: Request,
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(security.get_current_customer_alternative)
):
    """Get total count of customer orders for pagination"""
    from datetime import datetime
    
    query = db.query(models.Order).filter(
        models.Order.customer_id == current_customer.id,
        models.Order.tenant_id == current_customer.tenant_id
    )
    
    # Apply same filters as main orders endpoint
    if status and status.lower() != 'all':
        query = query.filter(models.Order.status == status.lower())
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            models.Order.order_number.ilike(search_term)
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

# Customer order endpoints
@router.post("/{tenant_domain}/orders", response_model=Dict[str, Any])
def create_customer_order(
    tenant_domain: str,
    order: schemas.OrderCreateWithPayment,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(security.get_current_customer)
):
    """Create a new order for authenticated customer"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Verify customer belongs to this tenant
    if current_customer.tenant_id != tenant.id:
        raise HTTPException(status_code=403, detail="Customer not authorized for this store")
    
    try:
        result = crud.create_order_with_payment(
            db=db, 
            order_data=order, 
            customer_id=current_customer.id, 
            tenant_id=tenant.id
        )
        
        if result["success"]:
            # Convert SQLAlchemy model to dict for JSON serialization
            order_dict = {
                "id": result["order"].id,
                "order_number": result["order"].order_number,
                "customer_id": result["order"].customer_id,
                "tenant_id": result["order"].tenant_id,
                "status": result["order"].status.value,
                "total_amount": float(result["order"].total_amount),
                "created_at": result["order"].created_at.isoformat(),
                "updated_at": result["order"].updated_at.isoformat()
            }
            return {
                "success": True,
                "order": order_dict,
                "payment": result["payment"],
                "message": "Order placed successfully!"
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class GuestOrderRequest(BaseModel):
    items: List[schemas.OrderItemCreate]
    shipping_address: schemas.AddressCreate
    payment: schemas.PaymentRequest
    customer_info: schemas.CustomerInfo

@router.post("/{tenant_domain}/orders/guest", response_model=Dict[str, Any])
def create_guest_order(
    tenant_domain: str,
    request: GuestOrderRequest,
    db: Session = Depends(get_db)
):
    """Create order for guest customer (with registration)"""
    print(f"🛒 Guest order request for tenant: {tenant_domain}")
    print(f"📦 Items: {len(request.items)}")
    print(f"👤 Customer: {request.customer_info.email}")
    
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        print(f"❌ Tenant not found: {tenant_domain}")
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Get or create guest customer
    customer = crud.get_or_create_guest_customer(db, request.customer_info, tenant.id)
    customer_id = customer.id
    
    # Create order data
    order_data = schemas.OrderCreateWithPayment(
        items=request.items,
        shipping_address=request.shipping_address,
        payment=request.payment
    )
    
    try:
        print(f"💳 Processing order with payment...")
        result = crud.create_order_with_payment(
            db=db, 
            order_data=order_data, 
            customer_id=customer_id, 
            tenant_id=tenant.id
        )
        
        if result["success"]:
            print(f"✅ Order created successfully: {result['order'].order_number}")
            # Convert SQLAlchemy model to dict for JSON serialization
            order_dict = {
                "id": result["order"].id,
                "order_number": result["order"].order_number,
                "customer_id": result["order"].customer_id,
                "tenant_id": result["order"].tenant_id,
                "status": result["order"].status.value,
                "total_amount": float(result["order"].total_amount),
                "created_at": result["order"].created_at.isoformat(),
                "updated_at": result["order"].updated_at.isoformat()
            }
            return {
                "success": True,
                "order": order_dict,
                "payment": result["payment"],
                "message": "Order placed successfully!"
            }
        else:
            print(f"❌ Order creation failed: {result['error']}")
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        print(f"💥 Exception during order creation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

# Search endpoints
@router.get("/{tenant_domain}/search", response_model=List[schemas.Product])
def search_products(
    tenant_domain: str,
    q: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search products in a store"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Search products by name, description, and category
    products = db.query(models.Product).filter(
        models.Product.tenant_id == tenant.id,
        models.Product.quantity > 0,  # Only in-stock items
        (
            models.Product.name.ilike(f"%{q}%") |
            models.Product.description.ilike(f"%{q}%") |
            models.Product.category.ilike(f"%{q}%")
        )
    ).offset(skip).limit(limit).all()
    
    return products

@router.get("/{tenant_domain}/search/suggestions")
def get_search_suggestions(
    tenant_domain: str,
    q: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get search suggestions for autocomplete"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    suggestions = []
    
    # Product name suggestions
    products = db.query(models.Product).filter(
        models.Product.tenant_id == tenant.id,
        models.Product.quantity > 0,
        models.Product.name.ilike(f"%{q}%")
    ).limit(5).all()
    
    for product in products:
            "id": product.id,
>>>>>>> main
            "image_url": product.image_url
        })
        suggestions.append({
            "type": "product",
            "text": product.name,
            "subtitle": f"${product.price:.2f}",
            "count": None,
            "id": product.id,
            "image_url": product.image_url
        })
=======
            "id": product.id,
>>>>>>> main
            "image_url": product.image_url
        })
    
    # Category suggestions
    categories = db.query(models.Product.category).filter(
        models.Product.tenant_id == tenant.id,
        models.Product.quantity > 0,
        models.Product.category.ilike(f"%{q}%")
    ).distinct().limit(3).all()
    
    for category in categories:
        if category[0]:  # Check if category is not None
            count = db.query(models.Product).filter(
                models.Product.tenant_id == tenant.id,
                models.Product.quantity > 0,
                models.Product.category == category[0]
            ).count()
            
            suggestions.append({
                "type": "category",
                "text": category[0],
                "subtitle": "Category",
                "count": f"{count} products"
            })
    
    # Brand/manufacturer suggestions (extract from product names)
    # This is a simple approach - you might want to add a separate brand field
    brand_words = set()
    for product in products:
        words = product.name.split()
        for word in words:
            if len(word) > 2 and word.lower().startswith(q.lower()):
                brand_words.add(word)
    
    for brand in list(brand_words)[:2]:  # Limit to 2 brand suggestions
        brand_count = db.query(models.Product).filter(
            models.Product.tenant_id == tenant.id,
            models.Product.quantity > 0,
            models.Product.name.ilike(f"%{brand}%")
        ).count()
        
        if brand_count > 1:  # Only suggest if there are multiple products
            suggestions.append({
                "type": "brand",
                "text": brand,
                "subtitle": "Brand",
                "count": f"{brand_count} products"
            })
    
    return suggestions[:limit]

@router.get("/{tenant_domain}/info")
def get_tenant_info(
    tenant_domain: str,
    db: Session = Depends(get_db)
):
    """Get tenant information including branding for storefront display"""
    tenant = crud.get_tenant_by_name(db, name=tenant_domain)
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "domain": tenant.domain,
        "company_logo_url": tenant.company_logo_url,
        "brand_color_primary": tenant.brand_color_primary,
        "brand_color_secondary": tenant.brand_color_secondary,
        "company_description": tenant.company_description,
        "company_website": tenant.company_website,
        "contact_email": tenant.contact_email,
        "contact_phone": tenant.contact_phone
    }