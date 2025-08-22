from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from .models import Role, OrderStatus

# Schema for token data
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    quantity: int = 0
    category: str = "General"
    image_url: Optional[str] = None
    image_filename: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    image_filename: Optional[str] = None

class Product(ProductBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    tenant_name: str # To create or find the tenant for the first user
    tenant_domain: Optional[str] = None # Optional, can be derived from tenant_name

class User(UserBase):
    id: int
    role: Role
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserWithTenant(User):
    tenant: 'TenantBase'

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: Role

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class UserEmailUpdate(BaseModel):
    new_email: str

# --- Tenant Schemas ---
class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    domain: str

class TenantBrandingUpdate(BaseModel):
    company_logo_url: Optional[str] = None
    company_logo_filename: Optional[str] = None
    brand_color_primary: Optional[str] = None
    brand_color_secondary: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class Tenant(TenantBase):
    id: int
    domain: str
    company_logo_url: Optional[str] = None
    company_logo_filename: Optional[str] = None
    brand_color_primary: Optional[str] = "#007bff"
    brand_color_secondary: Optional[str] = "#6c757d"
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    users: List[User] = []
    products: List[Product] = []

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class CustomerInfo(CustomerBase):
    """Customer info for guest orders (no password required)"""
    pass

class CustomerCreate(CustomerBase):
    password: str

class Customer(CustomerBase):
    id: int
    tenant_id: int
    is_guest: bool = False
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Address Schemas ---
class AddressBase(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "United States"
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class Address(AddressBase):
    id: int
    customer_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Order Item Schemas ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    product: Optional['Product'] = None

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderBase(BaseModel):
    total_amount: Decimal
    shipping_address_id: Optional[int] = None

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: AddressCreate

class Order(OrderBase):
    id: int
    order_number: str
    customer_id: int
    tenant_id: int
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    customer: Optional[Customer] = None
    shipping_address: Optional[Address] = None
    order_items: List[OrderItem] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

# --- Payment Schemas ---
class PaymentRequest(BaseModel):
    card_number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    cardholder_name: str
    amount: Decimal

class PaymentResponse(BaseModel):
    success: bool
    transaction_id: Optional[str] = None
    error: Optional[str] = None
    card_type: Optional[str] = None
    last_four: Optional[str] = None
    authorization_code: Optional[str] = None
    message: Optional[str] = None

# --- Enhanced Order Creation with Payment ---
class OrderCreateWithPayment(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: AddressCreate
    payment: PaymentRequest

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#007bff"
    is_active: bool = True
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class Category(CategoryBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- AI Schemas ---
class DescriptionRequest(BaseModel):
    product_name: str
    keywords: List[str] = []

class DescriptionResponse(BaseModel):
    description: str
