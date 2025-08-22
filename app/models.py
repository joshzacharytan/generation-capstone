from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as PyEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import sqlalchemy as sa
from .database import Base
import enum

class Role(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    CUSTOMER = "customer"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False) # e.g., shop.company-a.com

    # Branding fields
    company_logo_url = Column(String, nullable=True)
    company_logo_filename = Column(String, nullable=True)
    brand_color_primary = Column(String(7), nullable=True, default="#007bff")  # Hex color
    brand_color_secondary = Column(String(7), nullable=True, default="#6c757d")
    company_description = Column(String(500), nullable=True)
    company_website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")
    categories = relationship("Category", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(PyEnum(Role), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    tenant = relationship("Tenant", back_populates="users")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    category = Column(String(100), nullable=False, default="General", index=True)  # Keep for backward compatibility
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # New foreign key
    image_url = Column(String, nullable=True)  # URL to the uploaded image
    image_filename = Column(String, nullable=True)  # Original filename
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    tenant = relationship("Tenant", back_populates="products")
    category_obj = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for guest customers
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    is_guest = Column(sa.Boolean, default=False, nullable=False)  # Flag for guest customers
    email_verified = Column(sa.Boolean, default=False, nullable=False)  # Email verification status
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    tenant = relationship("Tenant", back_populates="customers")
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="United States")
    is_default = Column(sa.Boolean, default=False)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)

    customer = relationship("Customer", back_populates="addresses")

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    status = Column(PyEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    total_amount = Column(sa.Numeric(10, 2), nullable=False)
    shipping_address_id = Column(Integer, ForeignKey("customer_addresses.id"))

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    customer = relationship("Customer", back_populates="orders")
    tenant = relationship("Tenant", back_populates="orders")
    shipping_address = relationship("CustomerAddress")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(sa.Numeric(10, 2), nullable=False)
    total_price = Column(sa.Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500))
    color = Column(String(7), default="#007bff")  # Hex color for UI
    is_active = Column(sa.Boolean, default=True)
    sort_order = Column(Integer, default=0)  # For custom ordering
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    created_at = Column(DateTime, server_default=sa.text('now()'), nullable=False)
    updated_at = Column(DateTime, server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False)

    tenant = relationship("Tenant", back_populates="categories")
    products = relationship("Product", back_populates="category_obj")
