import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import shutil
import aiohttp
import asyncio
from urllib.parse import urlparse
import re

# Configuration
UPLOAD_DIR = Path("app/static/uploads/products")
LOGO_UPLOAD_DIR = Path("app/static/uploads/logos")
BANNER_UPLOAD_DIR = Path("app/static/uploads/banners")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}

# Ensure upload directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
BANNER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class FileUploadService:
    @staticmethod
    def validate_image_file(file: UploadFile) -> bool:
        """Validate uploaded image file"""
        
        # Check file extension
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided"
            )
            
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size (this is approximate, actual size check happens during upload)
        if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Check content type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="File must be an image"
            )
        
        return True
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """Generate unique filename to prevent conflicts"""
        if not original_filename:
            original_filename = "upload.jpg"  # Default fallback
        file_extension = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_extension}"
    
    @staticmethod
    async def save_product_image(file: UploadFile, tenant_id: int) -> dict:
        """Save uploaded product image and return file info"""
        
        # Validate file
        FileUploadService.validate_image_file(file)
        
        # Create tenant-specific directory
        tenant_dir = UPLOAD_DIR / str(tenant_id)
        tenant_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        unique_filename = FileUploadService.generate_unique_filename(file.filename)
        file_path = tenant_dir / unique_filename
        
        try:
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                
                # Check actual file size
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                    )
                
                buffer.write(content)
            
            # Generate URL path (relative to static directory)
            relative_path = f"uploads/products/{tenant_id}/{unique_filename}"
            image_url = f"/static/{relative_path}"
            
            return {
                "success": True,
                "image_url": image_url,
                "image_filename": unique_filename,
                "original_filename": file.filename,
                "file_size": len(content)
            }
            
        except Exception as e:
            # Clean up file if something went wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    @staticmethod
    def delete_product_image(image_url: str, tenant_id: int) -> bool:
        """Delete product image file"""
        try:
            if not image_url:
                return True
            
            # Extract filename from URL
            filename = Path(image_url).name
            file_path = UPLOAD_DIR / str(tenant_id) / filename
            
            if file_path.exists():
                file_path.unlink()
                return True
            
        except Exception as e:
            print(f"Error deleting image: {e}")
        
        return False
    
    @staticmethod
    def get_image_info(image_url: str) -> Optional[dict]:
        """Get information about an uploaded image"""
        if not image_url:
            return None
        
        try:
            # Extract path from URL
            path_parts = image_url.split('/')
            if len(path_parts) >= 4:  # /static/uploads/products/{tenant_id}/{filename}
                tenant_id = path_parts[-2]
                filename = path_parts[-1]
                file_path = UPLOAD_DIR / tenant_id / filename
                
                if file_path.exists():
                    stat = file_path.stat()
                    return {
                        "exists": True,
                        "size": stat.st_size,
                        "filename": filename,
                        "path": str(file_path)
                    }
            
        except Exception as e:
            print(f"Error getting image info: {e}")
        
        return {"exists": False}
    
    @staticmethod
    async def save_company_logo(file: UploadFile, tenant_id: int) -> dict:
        """Save uploaded company logo and return file info"""
        
        # Validate file (allow SVG for logos)
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check content type
        if not file.content_type or not (file.content_type.startswith('image/') or file.content_type == 'image/svg+xml'):
            raise HTTPException(
                status_code=400, 
                detail="File must be an image"
            )
        
        # Create tenant-specific logo directory
        tenant_dir = LOGO_UPLOAD_DIR / str(tenant_id)
        tenant_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        unique_filename = FileUploadService.generate_unique_filename(file.filename)
        file_path = tenant_dir / unique_filename
        
        try:
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                
                # Check actual file size
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                    )
                
                buffer.write(content)
            
            # Generate URL path (relative to static directory)
            relative_path = f"uploads/logos/{tenant_id}/{unique_filename}"
            image_url = f"/static/{relative_path}"
            
            return {
                "success": True,
                "image_url": image_url,
                "image_filename": unique_filename,
                "original_filename": file.filename,
                "file_size": len(content)
            }
            
        except Exception as e:
            # Clean up file if something went wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save logo: {str(e)}")
    
    @staticmethod
    def delete_company_logo(image_url: str, tenant_id: int) -> bool:
        """Delete company logo file"""
        try:
            if not image_url:
                return True
            
            # Extract filename from URL
            filename = Path(image_url).name
            file_path = LOGO_UPLOAD_DIR / str(tenant_id) / filename
            
            if file_path.exists():
                file_path.unlink()
                return True
            
        except Exception as e:
            print(f"Error deleting logo: {e}")
        
        return False
    
    @staticmethod
    async def save_hero_banner(file: UploadFile, tenant_id: int) -> dict:
        """Save uploaded hero banner image and return file info"""
        
        # Validate file
        FileUploadService.validate_image_file(file)
        
        # Create tenant-specific banner directory
        tenant_dir = BANNER_UPLOAD_DIR / str(tenant_id)
        tenant_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        unique_filename = FileUploadService.generate_unique_filename(file.filename)
        file_path = tenant_dir / unique_filename
        
        try:
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                
                # Check actual file size
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                    )
                
                buffer.write(content)
            
            # Generate URL path (relative to static directory)
            relative_path = f"uploads/banners/{tenant_id}/{unique_filename}"
            image_url = f"/static/{relative_path}"
            
            return {
                "success": True,
                "image_url": image_url,
                "image_filename": unique_filename,
                "original_filename": file.filename,
                "file_size": len(content)
            }
            
        except Exception as e:
            # Clean up file if something went wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save banner: {str(e)}")
    
    @staticmethod
    def delete_hero_banner(image_url: str, tenant_id: int) -> bool:
        """Delete hero banner image file"""
        try:
            if not image_url:
                return True
            
            # Extract filename from URL
            filename = Path(image_url).name
            file_path = BANNER_UPLOAD_DIR / str(tenant_id) / filename
            
            if file_path.exists():
                file_path.unlink()
                return True
            
        except Exception as e:
            print(f"Error deleting banner: {e}")
        
        return False

    @staticmethod
    def validate_image_url(url: str) -> bool:
        """Validate if URL is properly formatted and points to an image"""
        try:
            # Basic URL validation
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return False
            
            # Check if URL has image extension
            path = parsed_url.path.lower()
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
            has_image_extension = any(path.endswith(ext) for ext in image_extensions)
            
            # Also accept URLs that might not have extensions but contain image indicators
            has_image_indicator = any(indicator in url.lower() for indicator in ['image', 'photo', 'picture', 'img'])
            
            return has_image_extension or has_image_indicator
            
        except Exception:
            return False

    @staticmethod
    async def save_product_image_from_url(url: str, tenant_id: int) -> dict:
        """Download and save product image from URL"""
        
        # Validate URL format
        if not FileUploadService.validate_image_url(url):
            raise HTTPException(
                status_code=400, 
                detail="Invalid image URL. Please provide a direct link to an image file."
            )
        
        # Create tenant-specific directory
        tenant_dir = UPLOAD_DIR / str(tenant_id)
        tenant_dir.mkdir(exist_ok=True)
        
        try:
            async with aiohttp.ClientSession() as session:
                # Set headers to mimic a browser request
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                async with session.get(url, headers=headers, timeout=30) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Failed to download image. HTTP status: {response.status}"
                        )
                    
                    # Check content type
                    content_type = response.headers.get('content-type', '').lower()
                    if not content_type.startswith('image/'):
                        raise HTTPException(
                            status_code=400, 
                            detail=f"URL does not point to an image. Content type: {content_type}"
                        )
                    
                    # Check content length
                    content_length = response.headers.get('content-length')
                    if content_length and int(content_length) > MAX_FILE_SIZE:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Image too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                        )
                    
                    # Read content
                    content = await response.read()
                    
                    # Double-check actual size
                    if len(content) > MAX_FILE_SIZE:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Image too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                        )
                    
                    # Generate filename based on content type and URL
                    parsed_url = urlparse(url)
                    original_filename = Path(parsed_url.path).name
                    
                    # If no filename from URL, generate one based on content type
                    if not original_filename or '.' not in original_filename:
                        extension_map = {
                            'image/jpeg': '.jpg',
                            'image/jpg': '.jpg',
                            'image/png': '.png',
                            'image/gif': '.gif',
                            'image/webp': '.webp',
                            'image/svg+xml': '.svg'
                        }
                        extension = extension_map.get(content_type, '.jpg')
                        original_filename = f"image_from_url{extension}"
                    
                    unique_filename = FileUploadService.generate_unique_filename(original_filename)
                    file_path = tenant_dir / unique_filename
                    
                    # Save file
                    with open(file_path, "wb") as buffer:
                        buffer.write(content)
                    
                    # Generate URL path
                    relative_path = f"uploads/products/{tenant_id}/{unique_filename}"
                    image_url = f"/static/{relative_path}"
                    
                    return {
                        "success": True,
                        "image_url": image_url,
                        "image_filename": unique_filename,
                        "original_filename": original_filename,
                        "source_url": url,
                        "file_size": len(content),
                        "content_type": content_type
                    }
                    
        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to download image: {str(e)}"
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=400, 
                detail="Image download timed out. Please try again or use a different URL."
            )
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            # Clean up file if something went wrong
            try:
                if 'file_path' in locals() and file_path.exists():
                    file_path.unlink()
            except:
                pass
            raise HTTPException(status_code=500, detail=f"Failed to save image from URL: {str(e)}")