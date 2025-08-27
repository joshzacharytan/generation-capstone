from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import get_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_for_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_super_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this resource.")
    return current_user

def get_current_user_alternative(request: Request, db: Session = Depends(get_db)):
    """
    Alternative authentication method that checks multiple headers for Cloudflare compatibility.
    Checks X-Auth-Token, X-User-Token, X-API-Key, and Authorization headers.
    """
    from fastapi import Request
    import logging
    
    logger = logging.getLogger(__name__)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try multiple header sources
    token = None
    token_source = None
    
    # Check custom headers first (less likely to be stripped by Cloudflare)
    for header_name in ['x-auth-token', 'x-user-token', 'x-api-key']:
        if header_name in request.headers:
            token = request.headers[header_name]
            token_source = header_name
            logger.debug(f"Token source: {header_name}, Token found: {token is not None}")
            break
    
    # Fallback to Authorization header
    if not token and 'authorization' in request.headers:
        auth_header = request.headers['authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
            token_source = "Authorization"
            logger.debug(f"Token source: Authorization, Token found: {token is not None}")
    
    if not token:
        logger.debug("No token found in any header")
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.debug("No email found in token payload")
            raise credentials_exception
        logger.debug(f"Token decoded successfully for email: {email} from {token_source}")
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        logger.debug(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        logger.debug(f"User not found for email: {token_data.email}")
        raise credentials_exception
    
    logger.debug(f"Authentication successful for user: {user.email} via {token_source}")
    return user

def get_current_customer(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current customer from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        customer_id: int = payload.get("customer_id")
        tenant_id: int = payload.get("tenant_id")
        if customer_id is None or tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    customer = crud.get_customer_by_id(db, customer_id=customer_id, tenant_id=tenant_id)
    if customer is None:
        raise credentials_exception
    return customer

def get_current_customer_alternative(request: Request, db: Session = Depends(get_db)):
    """Get current customer from token - Cloudflare compatible version"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try multiple headers to work around Cloudflare header stripping
    token = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    
    if not token:
        token = request.headers.get("x-auth-token")
    if not token:
        token = request.headers.get("x-user-token")
    if not token:
        token = request.headers.get("x-api-key")
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        customer_id: int = payload.get("customer_id")
        tenant_id: int = payload.get("tenant_id")
        if customer_id is None or tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    customer = crud.get_customer_by_id(db, customer_id=customer_id, tenant_id=tenant_id)
    if customer is None:
        raise credentials_exception
    return customer
