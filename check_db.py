#!/usr/bin/env python3
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check tenants
        result = conn.execute(text("SELECT id, name, domain FROM tenants;"))
        tenants = result.fetchall()
        
        print(f"\n📊 Found {len(tenants)} tenants:")
        for tenant in tenants:
            print(f"  - ID: {tenant[0]}, Name: {tenant[1]}, Domain: {tenant[2]}")
        
        # Check products count
        result = conn.execute(text("SELECT COUNT(*) FROM products;"))
        product_count = result.fetchone()[0]
        print(f"\n📦 Total products: {product_count}")
        
        # Check users count
        result = conn.execute(text("SELECT COUNT(*) FROM users;"))
        user_count = result.fetchone()[0]
        print(f"\n👥 Total users: {user_count}")
        
        # List all users with their details
        result = conn.execute(text("SELECT id, email, tenant_id FROM users;"))
        users = result.fetchall()
        print("\n👥 Users:")
        for user in users:
            print(f"  - ID: {user[0]}, Email: {user[1]}, Tenant: {user[2]}")
        
        # Check orders count
        result = conn.execute(text("SELECT COUNT(*) FROM orders;"))
        order_count = result.fetchone()[0]
        print(f"\n📋 Total orders: {order_count}")
        
        # Check customers count
        result = conn.execute(text("SELECT COUNT(*) FROM customers;"))
        customer_count = result.fetchone()[0]
        print(f"\n👤 Total customers: {customer_count}")
        
        # Test user lookup for test1@test.com
        result = conn.execute(text("SELECT id, email, tenant_id, hashed_password FROM users WHERE email = 'test1@test.com';"))
        user = result.fetchone()
        if user:
            print(f"\n👤 User test1@test.com found:")
            print(f"  - ID: {user[0]}")
            print(f"  - Email: {user[1]}")
            print(f"  - Tenant ID: {user[2]}")
            print(f"  - Has password: {'Yes' if user[3] else 'No'}")
        else:
            print(f"\n❌ User test1@test.com not found!")
        
        # Check tenant-specific data for tenant 2 (test1@test.com)
        print(f"\n🏢 Tenant 2 (Test1Co) specific data:")
        
        # Products for tenant 2
        result = conn.execute(text("SELECT COUNT(*) FROM products WHERE tenant_id = 2;"))
        tenant2_products = result.fetchone()[0]
        print(f"  📦 Products: {tenant2_products}")
        
        # Categories for tenant 2
        result = conn.execute(text("SELECT COUNT(*) FROM categories WHERE tenant_id = 2;"))
        tenant2_categories = result.fetchone()[0]
        print(f"  📂 Categories: {tenant2_categories}")
        
        # Orders for tenant 2
        result = conn.execute(text("SELECT COUNT(*) FROM orders WHERE tenant_id = 2;"))
        tenant2_orders = result.fetchone()[0]
        print(f"  📋 Orders: {tenant2_orders}")
        
        # Hero banners for tenant 2
        result = conn.execute(text("SELECT COUNT(*) FROM hero_banners WHERE tenant_id = 2;"))
        tenant2_banners = result.fetchone()[0]
        print(f"  🎨 Hero Banners: {tenant2_banners}")

except Exception as e:
    print(f"❌ Database connection error: {e}")