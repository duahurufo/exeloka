#!/usr/bin/env python3
"""
Exeloka v1 - Content Extractor
Enhanced content extraction from PDFs, images, and URLs
Supports OCR, PDF text extraction, and web content scraping
"""

import sys
import os
import tempfile
from pathlib import Path

# Import optional dependencies with error handling
try:
    import requests
    from urllib.parse import urlparse
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

def extract_pdf_text(pdf_path):
    """Extract text from PDF using PyMuPDF"""
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
            
        doc.close()
        return text.strip()
        
    except ImportError:
        return "Error: PyMuPDF (fitz) not installed. Install with: pip install PyMuPDF"
    except Exception as e:
        return f"Error extracting PDF text: {str(e)}"

def extract_pdf_text_fallback(pdf_path):
    """Fallback PDF extraction using pdfplumber"""
    try:
        import pdfplumber
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return text.strip()
        
    except ImportError:
        return "Error: pdfplumber not installed. Install with: pip install pdfplumber"
    except Exception as e:
        return f"Error extracting PDF text with pdfplumber: {str(e)}"

def extract_image_text_ocr(image_path):
    """Extract text from images using OCR (Tesseract)"""
    try:
        from PIL import Image
        import pytesseract
        
        # Open and process image
        image = Image.open(image_path)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text using OCR
        text = pytesseract.image_to_string(image)
        return text.strip()
        
    except ImportError as e:
        if 'PIL' in str(e) or 'Image' in str(e):
            return "Error: Pillow not installed. Install with: pip install Pillow"
        elif 'pytesseract' in str(e):
            return "Error: pytesseract not installed. Install with: pip install pytesseract"
        else:
            return f"Error: Missing dependency: {str(e)}"
    except Exception as e:
        return f"Error extracting text from image: {str(e)}"

def extract_url_content(url):
    """Extract text content from a URL"""
    if not REQUESTS_AVAILABLE:
        return "Error: Required packages not installed. Install with: pip install requests beautifulsoup4"
    
    try:
        # Validate URL
        parsed = urlparse(url)
        if not parsed.scheme:
            url = 'https://' + url
        
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Fetch the webpage
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse HTML content
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text.strip()
        
    except requests.exceptions.RequestException as e:
        return f"Error fetching URL: {str(e)}"
    except Exception as e:
        return f"Error extracting content from URL: {str(e)}"

def detect_content_type(file_path_or_url):
    """Detect if input is a file path or URL and determine content type"""
    # Check if it's a URL
    if file_path_or_url.startswith(('http://', 'https://')):
        return 'url'
    
    # Check if it's a file path
    if os.path.exists(file_path_or_url):
        file_ext = Path(file_path_or_url).suffix.lower()
        if file_ext == '.pdf':
            return 'pdf'
        elif file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif']:
            return 'image'
        else:
            return 'unknown_file'
    
    return 'unknown'

def extract_content(input_path):
    """Universal content extraction function"""
    content_type = detect_content_type(input_path)
    
    if content_type == 'pdf':
        # Try PyMuPDF first, then fallback to pdfplumber
        text = extract_pdf_text(input_path)
        if text.startswith("Error:") and "PyMuPDF" in text:
            text = extract_pdf_text_fallback(input_path)
        return text
        
    elif content_type == 'image':
        return extract_image_text_ocr(input_path)
        
    elif content_type == 'url':
        return extract_url_content(input_path)
        
    elif content_type == 'unknown_file':
        return f"Error: Unsupported file type. Supported types: PDF, images (JPG, PNG, etc.), URLs"
        
    elif content_type == 'unknown':
        return f"Error: File not found or invalid URL: {input_path}"
    
    return f"Error: Could not determine content type for: {input_path}"

def main():
    if len(sys.argv) != 2:
        print("Usage: python pdf_extractor.py <file_path_or_url>")
        print("Supported inputs:")
        print("  - PDF files (.pdf)")
        print("  - Image files (.jpg, .png, .bmp, .tiff, etc.)")
        print("  - URLs (http:// or https://)")
        sys.exit(1)
    
    input_path = sys.argv[1]
    text = extract_content(input_path)
    print(text)

if __name__ == "__main__":
    main()