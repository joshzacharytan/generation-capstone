from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from .. import schemas
from ..database import get_db
from ..services.payment import MockPaymentGateway

router = APIRouter()

@router.post("/validate-card", response_model=Dict[str, Any])
def validate_card(payment_data: schemas.PaymentRequest):
    """Validate credit card details without processing payment"""
    
    # Validate card number
    card_validation = MockPaymentGateway.validate_credit_card(payment_data.card_number)
    if not card_validation["valid"]:
        return {"valid": False, "error": card_validation["error"]}
    
    # Validate expiry
    expiry_validation = MockPaymentGateway.validate_expiry(
        payment_data.expiry_month, 
        payment_data.expiry_year
    )
    if not expiry_validation["valid"]:
        return {"valid": False, "error": expiry_validation["error"]}
    
    # Validate CVV
    cvv_validation = MockPaymentGateway.validate_cvv(
        payment_data.cvv, 
        card_validation["card_type"]
    )
    if not cvv_validation["valid"]:
        return {"valid": False, "error": cvv_validation["error"]}
    
    return {
        "valid": True,
        "card_type": card_validation["card_type"],
        "last_four": card_validation["last_four"]
    }

@router.post("/process", response_model=schemas.PaymentResponse)
def process_payment(payment_data: schemas.PaymentRequest):
    """Process a payment (mock implementation)"""
    
    result = MockPaymentGateway.process_payment({
        "card_number": payment_data.card_number,
        "expiry_month": payment_data.expiry_month,
        "expiry_year": payment_data.expiry_year,
        "cvv": payment_data.cvv,
        "amount": float(payment_data.amount),
        "currency": "USD"
    })
    
    return schemas.PaymentResponse(**result)
