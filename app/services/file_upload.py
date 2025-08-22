import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import shutil

# Configuration
UPLOAD_DIR = Path("app/static/uploads/products")
LOGO_UPLOAD_DIR = Path("app/static/uploads/logos")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}

# Ensure upload directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class FileUploadService:
    @staticmethod
    def validate_image_file(file: UploadFile) -> bool:
        """Validate uploaded image file"""
        
        # Check file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size (this is approximate, actual size check happens during upload)
        if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
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