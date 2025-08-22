#!/usr/bin/env python3
"""
Test script to verify guest customer functionality
"""

import requests
import json

# Test data
TENANT_DOMAIN = "test-store"  # Replace with your actual tenant domain
BASE_URL = "http://127.0.0.1:8000"

def test_guest_order():
    """Test creating a guest order"""
    
    guest_order_data = {
        "items": [
            {
                "product_id": 1,  # Replace with actual product ID
                "quantity": 2
            }
        ],
        "shipping_address": {
            "address_line1": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "postal_code": "12345",
            "country": "United States"
        },
        "payment": {
            "card_number": "4111111111111111",
            "expiry_month": 12,
            "expiry_year": 2025,
            "cvv": "123",
            "cardholder_name": "Test Guest",
            "amount": 50.00
        },
        "customer_info": {
            "email": "guest@example.com",
            "first_name": "Test",
            "last_name": "Guest",
            "phone": "+1234567890"
        }
    }
    
    print("🧪 Testing guest order creation...")
    print(f"📡 POST {BASE_URL}/{TENANT_DOMAIN}/orders/guest")
    
    try:
        response = requests.post(
            f"{BASE_URL}/{TENANT_DOMAIN}/orders/guest",
            json=guest_order_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Guest order created successfully!")
            print(f"📦 Order Number: {result.get('order_number', 'N/A')}")
            print(f"👤 Customer ID: {result.get('customer_id', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to create guest order")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure uvicorn is running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_store_info():
    """Test getting store info to verify tenant exists"""
    
    print(f"🧪 Testing store info retrieval...")
    print(f"📡 GET {BASE_URL}/{TENANT_DOMAIN}")
    
    try:
        response = requests.get(f"{BASE_URL}/{TENANT_DOMAIN}")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Store info retrieved successfully!")
            print(f"🏪 Store Name: {result.get('name', 'N/A')}")
            return True
        else:
            print(f"❌ Failed to get store info")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting guest customer functionality tests...\n")
    
    # Test 1: Check if store exists
    store_test = test_store_info()
    print()
    
    if store_test:
        # Test 2: Create guest order
        guest_test = test_guest_order()
        print()
        
        if guest_test:
            print("🎉 All tests passed! Guest customer functionality is working.")
        else:
            print("⚠️  Guest order test failed. Check the logs above.")
    else:
        print("⚠️  Store test failed. Make sure you have a tenant with the correct domain.")
    
    print("\n📝 Note: Update TENANT_DOMAIN and product_id in this script for your specific setup.")