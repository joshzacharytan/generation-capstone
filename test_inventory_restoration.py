#!/usr/bin/env python3
"""
Test script to verify inventory restoration when orders are cancelled
"""

import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

def test_inventory_restoration():
    """Test inventory restoration functionality"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    engine = create_engine(database_url)
    
    print("🧪 Testing Inventory Restoration Logic...\n")
    
    try:
        with engine.connect() as conn:
            # Get recent orders with their items and product info
            result = conn.execute(text("""
                SELECT 
                    o.id as order_id,
                    o.order_number,
                    o.status,
                    o.created_at,
                    oi.product_id,
                    oi.quantity as ordered_quantity,
                    p.name as product_name,
                    p.quantity as current_inventory
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                ORDER BY o.created_at DESC
                LIMIT 10
            """))
            
            orders = result.fetchall()
            
            if not orders:
                print("📭 No orders found in database")
                return True
            
            print("📦 Recent Orders and Inventory Status:")
            print("=" * 120)
            print(f"{'Order #':<15} {'Status':<12} {'Product':<25} {'Ordered':<8} {'Current Stock':<15} {'Created'}")
            print("-" * 120)
            
            for order in orders:
                status_emoji = {
                    'pending': '⏳',
                    'confirmed': '✅',
                    'processing': '🔄',
                    'shipped': '🚚',
                    'delivered': '📦',
                    'cancelled': '❌',
                    'CANCELLED': '❌'  # Handle uppercase variant
                }.get(order.status, '❓')
                
                created_date = order.created_at.strftime("%Y-%m-%d %H:%M")
                
                print(f"{order.order_number:<15} {status_emoji} {order.status:<10} {order.product_name:<25} {order.ordered_quantity:<8} {order.current_inventory:<15} {created_date}")
            
            print("-" * 120)
            
            # Check for any cancelled orders
            cancelled_orders = [o for o in orders if o.status.lower() == 'cancelled']
            if cancelled_orders:
                print(f"\n❌ Found {len(cancelled_orders)} cancelled orders")
                print("💡 Inventory should have been restored for these orders")
            else:
                print("\n✅ No cancelled orders found")
            
            # Show inventory summary
            print("\n📊 Current Product Inventory:")
            result = conn.execute(text("""
                SELECT 
                    p.id,
                    p.name,
                    p.quantity,
                    COALESCE(SUM(CASE WHEN o.status::text != 'CANCELLED' THEN oi.quantity ELSE 0 END), 0) as reserved_quantity
                FROM products p
                LEFT JOIN order_items oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id
                GROUP BY p.id, p.name, p.quantity
                ORDER BY p.name
            """))
            
            products = result.fetchall()
            
            print("=" * 80)
            print(f"{'Product ID':<12} {'Product Name':<30} {'Available':<12} {'Reserved':<12}")
            print("-" * 80)
            
            for product in products:
                print(f"{product.id:<12} {product.name:<30} {product.quantity:<12} {product.reserved_quantity:<12}")
            
            print("-" * 80)
            
    except Exception as e:
        print(f"❌ Database query failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_inventory_restoration()
    print("\n💡 To test inventory restoration:")
    print("1. Place an order through the frontend")
    print("2. Note the product inventory before and after")
    print("3. Cancel the order through admin dashboard")
    print("4. Check if inventory is restored")
    print("5. Run this script again to verify the changes")
    
    sys.exit(0 if success else 1)