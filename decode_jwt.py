#!/usr/bin/env python3
import base64
import json
import sys

def decode_jwt_payload(token):
    """Decode JWT payload without verification"""
    try:
        # Split the token
        parts = token.split('.')
        if len(parts) != 3:
            print("Invalid JWT format")
            return
        
        # Decode header
        header = parts[0]
        # Add padding if needed
        header += '=' * (4 - len(header) % 4)
        header_decoded = base64.urlsafe_b64decode(header)
        print("Header:", json.dumps(json.loads(header_decoded), indent=2))
        
        # Decode payload
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        payload_decoded = base64.urlsafe_b64decode(payload)
        print("Payload:", json.dumps(json.loads(payload_decoded), indent=2))
        
    except Exception as e:
        print(f"Error decoding JWT: {e}")

if __name__ == "__main__":
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0MUB0ZXN0LmNvbSIsImV4cCI6MTc1NjI4NjMzNX0.g4zjooILOA8UlSpS7Hrq9g2HY8EdLfXxmKEOWfwVE7s"
    decode_jwt_payload(token)