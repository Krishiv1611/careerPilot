"""
Encryption utilities for securely storing API keys in the database.
Uses Fernet symmetric encryption with SECRET_KEY as the base.
"""

from cryptography.fernet import Fernet
import base64
import hashlib
import os

def get_encryption_key() -> bytes:
    """
    Derive encryption key from SECRET_KEY environment variable.
    Uses SHA256 to create a 32-byte key suitable for Fernet.
    """
    secret_key = os.getenv("SECRET_KEY", "supersecretkey")
    # Derive a 32-byte key from SECRET_KEY using SHA256
    key = hashlib.sha256(secret_key.encode()).digest()
    # Fernet requires base64-encoded 32-byte key
    return base64.urlsafe_b64encode(key)

def encrypt_api_key(plain_key: str) -> str:
    """
    Encrypt an API key for secure storage.
    
    Args:
        plain_key: The plain text API key
        
    Returns:
        Encrypted API key as a string
    """
    if not plain_key:
        return None
    
    f = Fernet(get_encryption_key())
    encrypted = f.encrypt(plain_key.encode())
    return encrypted.decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key from storage.
    
    Args:
        encrypted_key: The encrypted API key from database
        
    Returns:
        Decrypted plain text API key
    """
    if not encrypted_key:
        return None
    
    f = Fernet(get_encryption_key())
    decrypted = f.decrypt(encrypted_key.encode())
    return decrypted.decode()
