#!/usr/bin/env python3
"""
Test script for content extractor functionality
"""

from utils.pdf_extractor import extract_content, detect_content_type

def test_content_extractor():
    """Test the content extractor with various inputs"""
    
    print("=== Content Extractor Test Suite ===\n")
    
    # Test content type detection
    print("1. Testing content type detection:")
    test_cases = [
        "https://example.com",
        "test.pdf", 
        "image.jpg",
        "document.png",
        "unknown.txt",
        "nonexistent.pdf"
    ]
    
    for test_case in test_cases:
        content_type = detect_content_type(test_case)
        print(f"   {test_case} -> {content_type}")
    
    print("\n2. Testing extraction with missing dependencies:")
    
    # Test URL extraction
    result = extract_content("https://example.com")
    print(f"   URL extraction: {result}")
    
    # Test non-existent PDF
    result = extract_content("nonexistent.pdf")
    print(f"   Non-existent PDF: {result}")
    
    # Test non-existent image
    result = extract_content("nonexistent.jpg")
    print(f"   Non-existent image: {result}")
    
    print("\n3. Dependencies status:")
    try:
        import requests
        print("   [+] requests available")
    except ImportError:
        print("   [-] requests not available")
    
    try:
        import fitz
        print("   [+] PyMuPDF available")
    except ImportError:
        print("   [-] PyMuPDF not available")
    
    try:
        import pdfplumber
        print("   [+] pdfplumber available")
    except ImportError:
        print("   [-] pdfplumber not available")
    
    try:
        from PIL import Image
        import pytesseract
        print("   [+] OCR dependencies available")
    except ImportError:
        print("   [-] OCR dependencies not available")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_content_extractor()