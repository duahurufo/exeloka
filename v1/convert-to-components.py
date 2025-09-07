#!/usr/bin/env python3
"""
Script to convert HTML pages to use the component system
"""

import os
import re

def convert_file(filepath, is_auth_page=False, current_section=''):
    """Convert a single HTML file to use components"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Determine base path for script inclusion
    script_path = 'includes/components.js'
    if '/projects/' in filepath or '/knowledge/' in filepath or '/recommendations/' in filepath:
        script_path = '../includes/components.js'
    
    # Replace header
    if is_auth_page:
        # Replace auth header pattern
        header_pattern = r'<header class="header">.*?</header>'
        content = re.sub(header_pattern, '<div data-component="auth-header"></div>', content, flags=re.DOTALL)
    else:
        # Replace main header pattern
        header_pattern = r'<header class="header">.*?</header>'
        replacement = f'<div data-component="header" data-current="{current_section}"></div>'
        content = re.sub(header_pattern, replacement, content, flags=re.DOTALL)
    
    # Replace footer
    if is_auth_page:
        # Replace simple footer pattern
        footer_pattern = r'<footer[^>]*>.*?</footer>'
        content = re.sub(footer_pattern, '<div data-component="simple-footer"></div>', content, flags=re.DOTALL)
    else:
        # Replace full footer pattern
        footer_pattern = r'<footer[^>]*>.*?</footer>'
        content = re.sub(footer_pattern, '<div data-component="footer"></div>', content, flags=re.DOTALL)
    
    # Add script reference before closing body tag if not present
    if 'includes/components.js' not in content:
        content = content.replace('</body>', f'    \n    <script src="{script_path}"></script>\n</body>')
    
    # Write back to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Converted {filepath}")

def main():
    """Convert all HTML files"""
    
    files_to_convert = [
        # Auth pages (use simple header/footer)
        ('register.html', True, ''),
        ('index.html', True, ''),  # Landing page uses auth header
        
        # Main application pages (use full header/footer)
        # dashboard.html already converted manually
        ('projects/index.html', False, 'projects'),
        ('projects/new.html', False, 'projects'),
        ('projects/view.html', False, 'projects'),
        ('knowledge/index.html', False, 'knowledge'),
        ('knowledge/add.html', False, 'knowledge'),
        ('recommendations/index.html', False, 'recommendations'),
        
        # Special pages
        ('error.html', True, ''),
        ('maintenance.html', True, ''),
    ]
    
    print("Converting HTML pages to use component system...")
    
    for filepath, is_auth, section in files_to_convert:
        if os.path.exists(filepath):
            convert_file(filepath, is_auth, section)
        else:
            print(f"⚠ File not found: {filepath}")
    
    print("\n✅ Conversion complete!")
    print("\nAll pages now use the centralized component system:")
    print("- Headers and footers are managed in includes/components.js")
    print("- Easy to maintain and update across all pages")
    print("- Consistent navigation and branding")

if __name__ == '__main__':
    main()