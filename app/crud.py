from sqlalchemy.orm import Session
import sqlalchemy as sa
from . import models, schemas, security

# --- User and Tenant CRUD ---

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_tenant_by_name(db: Session, name: str):
    return db.query(models.Tenant).filter(models.Tenant.name == name).first()

def get_tenant_by_domain(db: Session, domain: str):
    return db.query(models.Tenant).filter(models.Tenant.domain == domain).first()

def create_tenant(db: Session, name: str, domain: str):
    db_tenant = models.Tenant(name=name, domain=domain)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def create_user(db: Session, user: schemas.UserCreate):
    # Check if tenant exists, if not create it
    tenant = get_tenant_by_name(db, name=user.tenant_name)
    if not tenant:
        # For simplicity, derive domain from name. e.g., "My Awesome Shop" -> "my-awesome-shop.com"
        domain = user.tenant_domain or f"{user.tenant_name.lower().replace(' ', '-')}.example.com"
        tenant = create_tenant(db, name=user.tenant_name, domain=domain)
    
    hashed_password = security.get_password_hash(user.password)
    
    # The first user of a tenant becomes the Tenant Admin
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        tenant_id=tenant.id,
        role=models.Role.TENANT_ADMIN
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user_id: int, hashed_password: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.hashed_password = hashed_password
        db.commit()
        db.refresh(db_user)
    return db_user

def update_user_email(db: Session, user_id: int, new_email: str):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.email = new_email
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user_account(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

# --- Product CRUD ---

def get_products_by_tenant(db: Session, tenant_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Product).filter(models.Product.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_products_with_filters(
    db: Session, 
    tenant_id: int, 
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    category: str = None,
    stock_filter: str = None,
    min_price: float = None,
    max_price: float = None,
    sort_by: str = "name",
    sort_order: str = "asc"
):
    """Get products with advanced filtering and search"""
    query = db.query(models.Product).filter(models.Product.tenant_id == tenant_id)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Product.name.ilike(search_term)) |
            (models.Product.description.ilike(search_term)) |
            (models.Product.category.ilike(search_term)) |
            (models.Product.id.cast(sa.String).ilike(search_term))
        )
    
    # Category filter
    if category:
        query = query.filter(models.Product.category == category)
    
    # Stock filter
    if stock_filter:
        if stock_filter == "in-stock":
            query = query.filter(models.Product.quantity > 10)
        elif stock_filter == "low-stock":
            query = query.filter(models.Product.quantity.between(1, 10))
        elif stock_filter == "out-of-stock":
            query = query.filter(models.Product.quantity == 0)
    
    # Price range filters
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    
    # Sorting
    if sort_by == "price":
        sort_column = models.Product.price
    elif sort_by == "stock":
        sort_column = models.Product.quantity
    elif sort_by == "date":
        sort_column = models.Product.created_at
    else:  # default to name
        sort_column = models.Product.name
    
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    return query.offset(skip).limit(limit).all()

def get_product_analytics(db: Session, tenant_id: int):
    """Get product analytics and smart suggestions"""
    products = db.query(models.Product).filter(models.Product.tenant_id == tenant_id).all()
    
    if not products:
        return {
            "total_products": 0,
            "suggestions": {
                "low_stock": [],
                "no_image": [],
                "no_description": [],
                "high_value": [],
                "recently_added": []
            }
        }
    
    # Calculate analytics
    total_products = len(products)
    total_value = sum(p.price * p.quantity for p in products)
    avg_price = sum(p.price for p in products) / total_products if total_products > 0 else 0
    
    # Smart suggestions
    low_stock = [p for p in products if 0 < p.quantity <= 5][:5]
    no_image = [p for p in products if not p.image_url][:5]
    no_description = [p for p in products if not p.description or len(p.description.strip()) < 10][:5]
    high_value = sorted([p for p in products if p.price > 100], key=lambda x: x.price, reverse=True)[:5]
    recently_added = sorted(products, key=lambda x: x.created_at, reverse=True)[:5]
    
    # Stock distribution
    in_stock = len([p for p in products if p.quantity > 10])
    low_stock_count = len([p for p in products if 0 < p.quantity <= 10])
    out_of_stock = len([p for p in products if p.quantity == 0])
    
    return {
        "total_products": total_products,
        "total_inventory_value": float(total_value),
        "average_price": float(avg_price),
        "stock_distribution": {
            "in_stock": in_stock,
            "low_stock": low_stock_count,
            "out_of_stock": out_of_stock
        },
        "suggestions": {
            "low_stock": [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in low_stock],
            "no_image": [{"id": p.id, "name": p.name} for p in no_image],
            "no_description": [{"id": p.id, "name": p.name} for p in no_description],
            "high_value": [{"id": p.id, "name": p.name, "price": float(p.price)} for p in high_value],
            "recently_added": [{"id": p.id, "name": p.name, "created_at": p.created_at.isoformat()} for p in recently_added]
        }
    }

def get_product_by_id(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create_product_for_tenant(db: Session, product: schemas.ProductCreate, tenant_id: int):
    db_product = models.Product(**product.model_dump(), tenant_id=tenant_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        for key, value in product_update.model_dump(exclude_unset=True).items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product

# --- Super Admin CRUD ---

def get_all_tenants(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tenant).offset(skip).limit(limit).all()

def get_tenant_by_id(db: Session, tenant_id: int):
    return db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()

def delete_tenant(db: Session, tenant_id: int):
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if db_tenant:
        db.delete(db_tenant)
        db.commit()
    return db_tenant

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user_role(db: Session, user_id: int, new_role: models.Role):
    db_user = db.get(models.User, user_id)
    if db_user:
        db_user.role = new_role
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Tenant Branding CRUD ---

def update_tenant_branding(db: Session, tenant_id: int, branding_data: schemas.TenantBrandingUpdate):
    """Update tenant branding information"""
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if db_tenant:
        for key, value in branding_data.model_dump(exclude_unset=True).items():
            setattr(db_tenant, key, value)
        db.commit()
        db.refresh(db_tenant)
    return db_tenant

def get_tenant_branding(db: Session, tenant_id: int):
    """Get tenant branding information"""
    return db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()

# --- Category CRUD ---

def get_categories_by_tenant(db: Session, tenant_id: int, active_only: bool = True):
    """Get all categories for a tenant"""
    query = db.query(models.Category).filter(models.Category.tenant_id == tenant_id)
    if active_only:
        query = query.filter(models.Category.is_active == True)
    return query.order_by(models.Category.sort_order, models.Category.name).all()

def get_category_by_id(db: Session, category_id: int, tenant_id: int):
    """Get a specific category by ID for a tenant"""
    return db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.tenant_id == tenant_id
    ).first()

def create_category(db: Session, category: schemas.CategoryCreate, tenant_id: int):
    """Create a new category for a tenant"""
    db_category = models.Category(**category.model_dump(), tenant_id=tenant_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_update: schemas.CategoryUpdate, tenant_id: int):
    """Update a category"""
    db_category = get_category_by_id(db, category_id, tenant_id)
    if db_category:
        for key, value in category_update.model_dump(exclude_unset=True).items():
            setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int, tenant_id: int):
    """Delete a category (soft delete by setting inactive)"""
    db_category = get_category_by_id(db, category_id, tenant_id)
    if db_category:
        # Check if any products use this category
        products_count = db.query(models.Product).filter(
            models.Product.category_id == category_id
        ).count()
        
        if products_count > 0:
            # Soft delete - just mark as inactive
            db_category.is_active = False
            db.commit()
            db.refresh(db_category)
            return {"deleted": False, "deactivated": True, "products_count": products_count}
        else:
            # Hard delete if no products use it
            db.delete(db_category)
            db.commit()
            return {"deleted": True, "deactivated": False, "products_count": 0}
    return None

def get_legacy_categories_by_tenant(db: Session, tenant_id: int):
    """Get all unique legacy categories (string-based) for a tenant"""
    categories = db.query(models.Product.category).filter(
        models.Product.tenant_id == tenant_id
    ).distinct().all()
    return [category[0] for category in categories if category[0]]

def create_default_categories(db: Session, tenant_id: int):
    """Create default categories for a new tenant"""
    from .constants import DEFAULT_CATEGORIES
    
    default_colors = ["#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8", "#6f42c1", "#fd7e14", "#20c997"]
    
    for i, category_name in enumerate(DEFAULT_CATEGORIES[:8]):  # Limit to 8 default categories
        existing = db.query(models.Category).filter(
            models.Category.name == category_name,
            models.Category.tenant_id == tenant_id
        ).first()
        
        if not existing:
            db_category = models.Category(
                name=category_name,
                description=f"Default {category_name.lower()} category",
                color=default_colors[i % len(default_colors)],
                sort_order=i,
                tenant_id=tenant_id
            )
            db.add(db_category)
    
    db.commit()

# --- Customer CRUD ---

def get_customer_by_email(db: Session, email: str, tenant_id: int):
    return db.query(models.Customer).filter(
        models.Customer.email == email,
        models.Customer.tenant_id == tenant_id
    ).first()

def create_customer(db: Session, customer: schemas.CustomerCreate, tenant_id: int):
    hashed_password = security.get_password_hash(customer.password)
    db_customer = models.Customer(
        email=customer.email,
        hashed_password=hashed_password,
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        is_guest=False,  # Regular registered customer
        email_verified=False,  # Can be verified later
        tenant_id=tenant_id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_or_create_guest_customer(db: Session, customer_info: schemas.CustomerInfo, tenant_id: int):
    """Get existing customer or create new guest customer"""
    # Check if customer already exists
    existing_customer = db.query(models.Customer).filter(
        models.Customer.email == customer_info.email,
        models.Customer.tenant_id == tenant_id
    ).first()
    
    if existing_customer:
        return existing_customer
    
    # Create new guest customer
    db_customer = models.Customer(
        email=customer_info.email,
        first_name=customer_info.first_name,
        last_name=customer_info.last_name,
        phone=customer_info.phone,
        hashed_password=None,  # No password for guest customers
        is_guest=True,  # Mark as guest customer
        email_verified=False,  # Guests haven't verified email
        tenant_id=tenant_id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_customer_by_id(db: Session, customer_id: int, tenant_id: int):
    return db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == tenant_id
    ).first()

def create_customer_address(db: Session, address: schemas.AddressCreate, customer_id: int):
    db_address = models.CustomerAddress(**address.model_dump(), customer_id=customer_id)
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

# --- Order CRUD ---

def generate_order_number(db: Session, tenant_id: int):
    """Generate unique order number for tenant"""
    import datetime
    year = datetime.datetime.now().year
    
    # Count orders for this tenant this year
    count = db.query(models.Order).filter(
        models.Order.tenant_id == tenant_id,
        sa.extract('year', models.Order.created_at) == year
    ).count()
    
    return f"ORD-{year}-{tenant_id:03d}-{count + 1:04d}"

def create_order(db: Session, order_data: schemas.OrderCreate, customer_id: int, tenant_id: int):
    """Create order and update inventory"""
    try:
        
        # Create shipping address
        shipping_address = create_customer_address(db, order_data.shipping_address, customer_id)
        
        # Calculate total and validate inventory
        total_amount = 0
        order_items_data = []
        
        for item in order_data.items:
            product = get_product_by_id(db, item.product_id)
            if not product or product.tenant_id != tenant_id:
                raise ValueError(f"Product {item.product_id} not found")
            
            if product.quantity < item.quantity:
                raise ValueError(f"Insufficient inventory for {product.name}. Available: {product.quantity}, Requested: {item.quantity}")
            
            item_total = product.price * item.quantity
            total_amount += item_total
            
            order_items_data.append({
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': product.price,
                'total_price': item_total,
                'product': product
            })
        
        # Create order
        order_number = generate_order_number(db, tenant_id)
        db_order = models.Order(
            order_number=order_number,
            customer_id=customer_id,
            tenant_id=tenant_id,
            total_amount=total_amount,
            shipping_address_id=shipping_address.id
        )
        db.add(db_order)
        db.flush()  # Get order ID
        
        # Create order items and update inventory
        for item_data in order_items_data:
            # Create order item
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price']
            )
            db.add(db_order_item)
            
            # Update product inventory
            product = item_data['product']
            product.quantity -= item_data['quantity']
            db.add(product)
        
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except Exception as e:
        raise e

def create_order_with_payment(db: Session, order_data: schemas.OrderCreateWithPayment, customer_id: int, tenant_id: int):
    """Create order with payment processing"""
    from app.services.payment import MockPaymentGateway
    
    try:
        
        # Create shipping address
        shipping_address = create_customer_address(db, order_data.shipping_address, customer_id)
        
        # Calculate total and validate inventory
        total_amount = 0
        order_items_data = []
        
        for item in order_data.items:
            product = get_product_by_id(db, item.product_id)
            if not product or product.tenant_id != tenant_id:
                raise ValueError(f"Product {item.product_id} not found")
            
            if product.quantity < item.quantity:
                raise ValueError(f"Insufficient inventory for {product.name}. Available: {product.quantity}, Requested: {item.quantity}")
            
            item_total = product.price * item.quantity
            total_amount += item_total
            
            order_items_data.append({
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': product.price,
                'total_price': item_total,
                'product': product
            })
        
        # Process payment
        payment_result = MockPaymentGateway.process_payment({
            "card_number": order_data.payment.card_number,
            "expiry_month": order_data.payment.expiry_month,
            "expiry_year": order_data.payment.expiry_year,
            "cvv": order_data.payment.cvv,
            "amount": float(total_amount),
            "currency": "USD"
        })
        
        if not payment_result["success"]:
            return {"success": False, "error": payment_result["error"], "order": None}
        
        # Create order
        order_number = generate_order_number(db, tenant_id)
        db_order = models.Order(
            order_number=order_number,
            customer_id=customer_id,
            tenant_id=tenant_id,
            total_amount=total_amount,
            shipping_address_id=shipping_address.id,
            status=models.OrderStatus.CONFIRMED  # Auto-confirm paid orders
        )
        db.add(db_order)
        db.flush()  # Get order ID
        
        # Create order items and update inventory
        for item_data in order_items_data:
            # Create order item
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price']
            )
            db.add(db_order_item)
            
            # Update product inventory
            product = item_data['product']
            product.quantity -= item_data['quantity']
            db.add(product)
        
        db.commit()
        db.refresh(db_order)
        
        return {
            "success": True,
            "order": db_order,
            "payment": payment_result
        }
        
    except Exception as e:
        raise e

def get_orders_by_tenant(db: Session, tenant_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Order).filter(
        models.Order.tenant_id == tenant_id
    ).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def get_order_by_id(db: Session, order_id: int, tenant_id: int):
    return db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.tenant_id == tenant_id
    ).first()

def update_order_status(db: Session, order_id: int, status: models.OrderStatus, tenant_id: int):
    db_order = get_order_by_id(db, order_id, tenant_id)
    if not db_order:
        return None
    
    # Store the previous status to determine if inventory needs to be restored
    previous_status = db_order.status
    
    # Prevent unnecessary updates
    if previous_status == status:
        return db_order
    
    print(f"📋 Order {db_order.order_number}: {previous_status.value} → {status.value}")
    
    # Update the order status
    db_order.status = status
    
    # Handle inventory restoration when order is cancelled
    if status == models.OrderStatus.CANCELLED and previous_status != models.OrderStatus.CANCELLED:
        print(f"❌ Cancelling order {db_order.order_number} - restoring inventory...")
        
        # Restore inventory for all items in the cancelled order
        for order_item in db_order.order_items:
            product = get_product_by_id(db, order_item.product_id)
            if product and product.tenant_id == tenant_id:
                # Store original quantity for logging
                original_quantity = product.quantity
                
                # Add back the quantity that was reserved for this order
                product.quantity += order_item.quantity
                db.add(product)
                
                print(f"🔄 Product '{product.name}' (ID: {product.id}): {original_quantity} + {order_item.quantity} = {product.quantity}")
            else:
                print(f"⚠️  Warning: Could not restore inventory for product ID {order_item.product_id} - product not found or tenant mismatch")
        
        print(f"✅ Inventory restoration completed for order {db_order.order_number}")
    
    # Handle case where cancelled order is being reactivated (edge case)
    elif previous_status == models.OrderStatus.CANCELLED and status in [
        models.OrderStatus.CONFIRMED, 
        models.OrderStatus.PROCESSING, 
        models.OrderStatus.SHIPPED
    ]:
        print(f"🔄 Reactivating cancelled order {db_order.order_number} - reducing inventory again...")
        
        # Re-reduce inventory for reactivated order
        for order_item in db_order.order_items:
            product = get_product_by_id(db, order_item.product_id)
            if product and product.tenant_id == tenant_id:
                if product.quantity >= order_item.quantity:
                    original_quantity = product.quantity
                    product.quantity -= order_item.quantity
                    db.add(product)
                    print(f"🔄 Product '{product.name}' (ID: {product.id}): {original_quantity} - {order_item.quantity} = {product.quantity}")
                else:
                    print(f"⚠️  Warning: Insufficient inventory for product '{product.name}' (ID: {product.id}). Available: {product.quantity}, Required: {order_item.quantity}")
                    # You might want to raise an exception here or handle this case differently
    
    db.commit()
    db.refresh(db_order)
    return db_order
