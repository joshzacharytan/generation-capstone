#!/usr/bin/env python3
"""
Simple test to debug authentication issues
"""
import os
import sys
sys.path.append('.')

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from dotenv import load_dotenv

# Import our modules
from app.database import get_db
from app import crud, models

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_for_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def debug_get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print(f"🔍 Debug: Received token: {token[:20]}...")
    print(f"🔍 Debug: SECRET_KEY: {SECRET_KEY}")
    print(f"🔍 Debug: ALGORITHM: {ALGORITHM}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"🔍 Debug: JWT decoded successfully: {payload}")
        
        email: str = payload.get("sub")
        if email is None:
            print("🔍 Debug: No email in token")
            raise credentials_exception
            
        print(f"🔍 Debug: Looking up user with email: {email}")
        
    except JWTError as e:
        print(f"🔍 Debug: JWT Error: {e}")
        raise credentials_exception
    
    try:
        user = crud.get_user_by_email(db, email=email)
        print(f"🔍 Debug: User lookup result: {user}")
        
        if user is None:
            print("🔍 Debug: User not found in database")
            raise credentials_exception
            
        print(f"🔍 Debug: User found - ID: {user.id}, Email: {user.email}, Tenant: {user.tenant_id}")
        return user
        
    except Exception as e:
        print(f"🔍 Debug: Database error: {e}")
        raise credentials_exception

app = FastAPI()

@app.get("/debug-auth")
def debug_auth(current_user: models.User = Depends(debug_get_current_user)):
    return {
        "message": "Authentication successful!",
        "user_id": current_user.id,
        "email": current_user.email,
        "tenant_id": current_user.tenant_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)