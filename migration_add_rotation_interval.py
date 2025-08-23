#!/usr/bin/env python3
"""
Database Migration: Add rotation_interval column to hero_banners table
Run this script to update existing database schema.
"""

import os
import sys
from sqlalchemy import create_engine, text
from pathlib import Path

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def get_database_url():
    """Get database URL from environment or use default"""
    # Try to get from environment first
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        return db_url
    
    # Check if using SQLite (common for development)
    if os.path.exists('app.db') or os.path.exists('app/app.db'):
        return 'sqlite:///app.db'
    
    # Default PostgreSQL
    return 'postgresql://postgres:password@localhost:5432/ecommerce_db'

def run_migration():
    """Add rotation_interval column to hero_banners table"""
    
    database_url = get_database_url()
    print(f"Connecting to database...")
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'hero_banners' 
                AND column_name = 'rotation_interval'
            """)
            
            result = connection.execute(check_query).fetchone()
            
            if result:
                print("✅ Column 'rotation_interval' already exists in hero_banners table.")
                return
            
            # Add the rotation_interval column
            migration_query = text("""
                ALTER TABLE hero_banners 
                ADD COLUMN rotation_interval INTEGER DEFAULT 5 NOT NULL
            """)
            
            print("🔄 Adding rotation_interval column to hero_banners table...")
            connection.execute(migration_query)
            connection.commit()
            
            print("✅ Migration completed successfully!")
            print("   - Added rotation_interval column with default value of 5 seconds")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting hero banner rotation interval migration...")
    run_migration()
    print("🎉 Migration completed!")