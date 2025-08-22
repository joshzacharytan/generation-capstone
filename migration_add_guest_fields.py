#!/usr/bin/env python3
"""
Migration script to add is_guest and email_verified fields to customers table
"""

import sys
import os
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

def run_migration():
    """Add is_guest and email_verified columns to customers table"""
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    engine = create_engine(database_url)
    
    print("🔄 Starting migration: Adding guest customer fields...")
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Add is_guest column
                print("📝 Adding is_guest column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT FALSE
                """))
                
                # Add email_verified column
                print("📝 Adding email_verified column...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE
                """))
                
                # Make hashed_password nullable for guest customers
                print("📝 Making hashed_password nullable...")
                conn.execute(text("""
                    ALTER TABLE customers 
                    ALTER COLUMN hashed_password DROP NOT NULL
                """))
                
                # Update existing customers to be non-guest and email verified
                print("📝 Updating existing customers...")
                conn.execute(text("""
                    UPDATE customers 
                    SET is_guest = FALSE, email_verified = TRUE 
                    WHERE hashed_password IS NOT NULL
                """))
                
                # Commit transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)