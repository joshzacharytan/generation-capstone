#!/usr/bin/env python3
"""
Script to check guest customers in the database
"""

import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

def check_guest_customers():
    """Check guest customers in the database"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    engine = create_engine(database_url)
    
    print("🔍 Checking guest customers in database...\n")
    
    try:
        with engine.connect() as conn:
            # Check all customers
            result = conn.execute(text("""
                SELECT 
                    id,
                    email,
                    first_name,
                    last_name,
                    is_guest,
                    email_verified,
                    CASE 
                        WHEN hashed_password IS NULL THEN 'No Password'
                        ELSE 'Has Password'
                    END as password_status,
                    created_at
                FROM customers 
                ORDER BY created_at DESC
                LIMIT 10
            """))
            
            customers = result.fetchall()
            
            if not customers:
                print("📭 No customers found in database")
                return True
            
            print("👥 Recent Customers:")
            print("=" * 100)
            print(f"{'ID':<4} {'Email':<25} {'Name':<20} {'Guest':<6} {'Verified':<9} {'Password':<12} {'Created'}")
            print("-" * 100)
            
            guest_count = 0
            regular_count = 0
            
            for customer in customers:
                is_guest = "✓" if customer.is_guest else "✗"
                is_verified = "✓" if customer.email_verified else "✗"
                created_date = customer.created_at.strftime("%Y-%m-%d %H:%M")
                
                print(f"{customer.id:<4} {customer.email:<25} {customer.first_name} {customer.last_name:<15} {is_guest:<6} {is_verified:<9} {customer.password_status:<12} {created_date}")
                
                if customer.is_guest:
                    guest_count += 1
                else:
                    regular_count += 1
            
            print("-" * 100)
            print(f"📊 Summary: {guest_count} guest customers, {regular_count} regular customers")
            
            # Check for any data integrity issues
            print("\n🔍 Data Integrity Check:")
            
            # Check for guests with passwords
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM customers 
                WHERE is_guest = TRUE AND hashed_password IS NOT NULL
            """))
            guests_with_passwords = result.fetchone().count
            
            # Check for regular customers without passwords
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM customers 
                WHERE is_guest = FALSE AND hashed_password IS NULL
            """))
            regulars_without_passwords = result.fetchone().count
            
            if guests_with_passwords > 0:
                print(f"⚠️  Warning: {guests_with_passwords} guest customers have passwords (should be NULL)")
            else:
                print("✅ All guest customers have NULL passwords")
            
            if regulars_without_passwords > 0:
                print(f"⚠️  Warning: {regulars_without_passwords} regular customers don't have passwords")
            else:
                print("✅ All regular customers have passwords")
                
    except Exception as e:
        print(f"❌ Database query failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = check_guest_customers()
    sys.exit(0 if success else 1)