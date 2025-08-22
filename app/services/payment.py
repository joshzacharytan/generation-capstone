"""
Mock Payment Gateway Service
This simulates a payment processor for demo purposes.
In production, this would integrate with Stripe, PayPal, etc.
"""

import uuid
import random
from typing import Dict, Any
from decimal import Decimal
import re

class MockPaymentGateway:
    """Mock payment gateway that always approves valid credit card formats"""
    
    @staticmethod
    def validate_credit_card(card_number: str) -> Dict[str, Any]:
        """Validate credit card number format (basic Luhn algorithm check)"""
        # Remove spaces and dashes
        card_number = re.sub(r'[\s-]', '', card_number)
        
        # Check if it's all digits
        if not card_number.isdigit():
            return {"valid": False, "error": "Card number must contain only digits"}
        
        # Check length (13-19 digits for most cards)
        if len(card_number) < 13 or len(card_number) > 19:
            return {"valid": False, "error": "Invalid card number length"}
        
        # Simple Luhn algorithm check
        def luhn_check(card_num):
            digits = [int(d) for d in card_num]
            for i in range(len(digits) - 2, -1, -2):
                digits[i] *= 2
                if digits[i] > 9:
                    digits[i] -= 9
            return sum(digits) % 10 == 0
        
        if not luhn_check(card_number):
            return {"valid": False, "error": "Invalid card number"}
        
        # Determine card type
        card_type = "Unknown"
        if card_number.startswith('4'):
            card_type = "Visa"
        elif card_number.startswith(('51', '52', '53', '54', '55')):
            card_type = "Mastercard"
        elif card_number.startswith(('34', '37')):
            card_type = "American Express"
        elif card_number.startswith('6011'):
            card_type = "Discover"
        
        return {
            "valid": True,
            "card_type": card_type,
            "last_four": card_number[-4:]
        }
    
    @staticmethod
    def validate_expiry(expiry_month: int, expiry_year: int) -> Dict[str, Any]:
        """Validate expiry date"""
        import datetime
        
        if expiry_month < 1 or expiry_month > 12:
            return {"valid": False, "error": "Invalid expiry month"}
        
        current_year = datetime.datetime.now().year
        current_month = datetime.datetime.now().month
        
        # Convert 2-digit year to 4-digit
        if expiry_year < 100:
            expiry_year += 2000
        
        if expiry_year < current_year:
            return {"valid": False, "error": "Card has expired"}
        
        if expiry_year == current_year and expiry_month < current_month:
            return {"valid": False, "error": "Card has expired"}
        
        return {"valid": True}
    
    @staticmethod
    def validate_cvv(cvv: str, card_type: str = "Unknown") -> Dict[str, Any]:
        """Validate CVV"""
        if not cvv.isdigit():
            return {"valid": False, "error": "CVV must be numeric"}
        
        # American Express uses 4-digit CVV, others use 3
        expected_length = 4 if card_type == "American Express" else 3
        
        if len(cvv) != expected_length:
            return {"valid": False, "error": f"CVV must be {expected_length} digits for {card_type}"}
        
        return {"valid": True}
    
    @classmethod
    def process_payment(cls, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a payment (mock implementation)
        Always approves if card details are valid format
        """
        
        # Extract payment details
        card_number = payment_data.get("card_number", "")
        expiry_month = payment_data.get("expiry_month", 0)
        expiry_year = payment_data.get("expiry_year", 0)
        cvv = payment_data.get("cvv", "")
        amount = payment_data.get("amount", 0)
        currency = payment_data.get("currency", "USD")
        
        # Validate card number
        card_validation = cls.validate_credit_card(card_number)
        if not card_validation["valid"]:
            return {
                "success": False,
                "error": card_validation["error"],
                "transaction_id": None
            }
        
        # Validate expiry
        expiry_validation = cls.validate_expiry(expiry_month, expiry_year)
        if not expiry_validation["valid"]:
            return {
                "success": False,
                "error": expiry_validation["error"],
                "transaction_id": None
            }
        
        # Validate CVV
        cvv_validation = cls.validate_cvv(cvv, card_validation["card_type"])
        if not cvv_validation["valid"]:
            return {
                "success": False,
                "error": cvv_validation["error"],
                "transaction_id": None
            }
        
        # Validate amount
        if amount <= 0:
            return {
                "success": False,
                "error": "Invalid amount",
                "transaction_id": None
            }
        
        # Generate mock transaction ID
        transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
        
        # Mock processing delay (in real world, this would be an API call)
        # For demo, we'll always approve
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "amount": amount,
            "currency": currency,
            "card_type": card_validation["card_type"],
            "last_four": card_validation["last_four"],
            "authorization_code": f"AUTH_{random.randint(100000, 999999)}",
            "message": "Payment processed successfully"
        }

# Test credit card numbers (these pass Luhn algorithm)
TEST_CARDS = {
    "visa": "4532015112830366",
    "mastercard": "5555555555554444", 
    "amex": "378282246310005",
    "discover": "6011111111111117"
}