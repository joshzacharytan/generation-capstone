#!/usr/bin/env python3
import os
from jose import JWTError, jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key_for_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

print(f"SECRET_KEY: {SECRET_KEY}")
print(f"ALGORITHM: {ALGORITHM}")

# Test token
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0MUB0ZXN0LmNvbSIsImV4cCI6MTc1NjI4NjQyNX0.cuEtY-VIvAit_Z9xY6BDdJTZMTwOxzEhzXjKGI9LSCk"

try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print("JWT validation successful!")
    print(f"Payload: {payload}")
    
    email = payload.get("sub")
    print(f"Email from token: {email}")
    
except JWTError as e:
    print(f"JWT validation failed: {e}")
except Exception as e:
    print(f"Other error: {e}")