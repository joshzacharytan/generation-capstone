#!/usr/bin/env python3
"""
One-time script to fix inventory for existing cancelled orders
"""

import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

def fix_cancelled_order_inventory():
    """Fix inventory for existing cancelled orders"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    engine = create_engine(database_url)
    
    print("🔧 Fixing inventory for existing cancelled orders...\n")
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Find all cancelled orders with their items
                result = conn.execute(text("""
                    SELECT 
                        o.id as order_id,
                        o.order_number,
                        oi.product_id,
                        oi.quantity,
                        p.name as product_name,
                        p.quantity as current_inventory
                    FROM orders o
                    JOIN order_items oi ON o.id = oi.order_id
                    JOIN products p ON oi.product_id = p.id
                    WHERE o.status::text = 'CANCELLED'
                    ORDER BY o.created_at DESC
                """))
                
                cancelled_items = result.fetchall()
                
                if not cancelled_items:
                    print("✅ No cancelled orders found that need inventory restoration")
                    trans.commit()
                    return True
                
                print(f"📋 Found {len(cancelled_items)} items in cancelled orders:")
                print("=" * 80)
                print(f"{'Order #':<20} {'Product':<30} {'Qty':<5} {'Current Stock'}")
                print("-" * 80)
                
                total_restored = 0
                
                for item in cancelled_items:
                    print(f"{item.order_number:<20} {item.product_name:<30} {item.quantity:<5} {item.current_inventory}")
                    
                    # Restore inventory
                    conn.execute(text("""
                        UPDATE products 
                        SET quantity = quantity + :restore_qty
                        WHERE id = :product_id
                    """), {
                        'restore_qty': item.quantity,
                        'product_id': item.product_id
                    })
                    
                    total_restored += item.quantity
                
                print("-" * 80)
                print(f"🔄 Restored {total_restored} total units across {len(cancelled_items)} items")
                
                # Show updated inventory
                print("\n📊 Updated Product Inventory:")
                result = conn.execute(text("""
                    SELECT 
                        p.id,
                        p.name,
                        p.quantity
                    FROM products p
                    WHERE p.id IN (
                        SELECT DISTINCT oi.product_id 
                        FROM orders o
                        JOIN order_items oi ON o.id = oi.order_id
                        WHERE o.status::text = 'CANCELLED'
                    )
                    ORDER BY p.name
                """))
                
                updated_products = result.fetchall()
                
                print("=" * 60)
                print(f"{'Product ID':<12} {'Product Name':<30} {'New Stock'}")
                print("-" * 60)
                
                for product in updated_products:
                    print(f"{product.id:<12} {product.name:<30} {product.quantity}")
                
                print("-" * 60)
                
                # Commit transaction
                trans.commit()
                print(f"\n✅ Successfully restored inventory for cancelled orders!")
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Inventory restoration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = fix_cancelled_order_inventory()
    
    if success:
        print("\n🎉 Inventory restoration completed!")
        print("💡 Future order cancellations will automatically restore inventory.")
    else:
        print("\n❌ Inventory restoration failed. Check the error above.")
    
    sys.exit(0 if success else 1)