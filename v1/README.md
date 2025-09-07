# Exeloka v1 - Cultural Wisdom Recommendation System

## 🎯 Overview
Exeloka is a comprehensive cultural wisdom recommendation system specifically designed for companies operating in Sampang, East Java, Indonesia. The system provides AI-powered insights and recommendations to help organizations navigate cultural complexities and build meaningful relationships with local communities.

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+ with PDO
- **Database**: MySQL 8.0+
- **Server**: Apache with mod_rewrite
- **Analysis**: Rule-based quick analysis + LLM enhanced analysis

### Security Features
- ✅ Comprehensive input validation and sanitization
- ✅ Password hashing with bcrypt
- ✅ Session security with HTTP-only cookies
- ✅ Rate limiting and brute force protection
- ✅ CORS configuration
- ✅ Security headers (HSTS, CSP, XSS Protection)
- ✅ SQL injection prevention with prepared statements
- ✅ File upload security with type validation
- ✅ Audit logging for security events

### Modern Design Features
- ✅ TypeScript-style JavaScript architecture
- ✅ Tailwind CSS utility classes
- ✅ Modern card-based UI with hover effects
- ✅ Responsive grid layouts
- ✅ Smooth transitions and animations
- ✅ Glass morphism design elements
- ✅ Professional color scheme with cultural sensitivity

## 🚀 XAMPP Deployment Guide

### Prerequisites
1. **XAMPP Installation**
   - Download XAMPP 8.2+ with PHP 8.0+ and MySQL
   - Install to default location (C:\xampp)
   - Start Apache and MySQL services

### Step 1: Project Setup
1. Copy the entire `v1` folder to `C:\xampp\htdocs\exeloka\`
2. Your project path should be: `C:\xampp\htdocs\exeloka\v1\`

### Step 2: Database Setup
1. Open phpMyAdmin at `http://localhost/phpmyadmin`
2. Create a new database named `exeloka`
3. Import the database schema:
   ```sql
   -- Navigate to the SQL tab and run the contents of database/schema.sql
   ```

### Step 3: Environment Configuration
1. Update the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USERNAME=root
   DB_PASSWORD=
   DB_DATABASE=exeloka
   ```

2. Update security settings in `.env`:
   ```env
   APP_DEBUG=false
   APP_ENV=production
   SESSION_SECURE=false
   ```

### Step 4: Apache Configuration
1. Ensure mod_rewrite is enabled in `C:\xampp\apache\conf\httpd.conf`:
   ```apache
   LoadModule rewrite_module modules/mod_rewrite.so
   ```

2. Allow .htaccess files:
   ```apache
   <Directory "C:/xampp/htdocs">
       AllowOverride All
   </Directory>
   ```

3. Restart Apache

### Step 5: Permissions Setup
Create the following directories with write permissions:
- `logs/` - For application logs
- `uploads/` - For file uploads
- `temp/` - For temporary files
- `cache/` - For caching
- `backups/` - For database backups

### Step 6: Access the Application
1. **Main Site**: `http://localhost/exeloka/v1/`
2. **Dashboard**: `http://localhost/exeloka/v1/dashboard.html`
3. **Login**: `http://localhost/exeloka/v1/login.html`
4. **Registration**: `http://localhost/exeloka/v1/register.html`

## 🧪 Testing the System

### Manual Testing Checklist
1. **Homepage Access**
   - [ ] Main landing page loads correctly
   - [ ] Navigation links work
   - [ ] Footer displays properly

2. **Authentication**
   - [ ] Registration form validates input
   - [ ] Login form accepts credentials
   - [ ] Session management works
   - [ ] Password strength validation

3. **Dashboard**
   - [ ] Statistics display correctly
   - [ ] User menu functions
   - [ ] Quick actions available

4. **Security**
   - [ ] SQL injection prevention
   - [ ] XSS protection active
   - [ ] Rate limiting functional
   - [ ] Secure headers present

### Test User Accounts
Default test accounts (password: `test123`):
- **Admin**: `admin@sampang.id`
- **User**: `user@company.com`
- **Expert**: `cultural@expert.id`

## 📊 Features Overview

### Core Features
- **Project Management**: Create and manage cultural engagement projects
- **Knowledge Base**: Store and organize cultural wisdom and insights
- **AI Recommendations**: Get intelligent suggestions for cultural navigation
- **Document Export**: Generate reports in DOCX, XLSX, and PPTX formats
- **Analytics Dashboard**: Track project success and cultural insights

### Cultural Intelligence Features
- **Sampang-Specific Insights**: Deep knowledge of local customs and traditions
- **Religious Leadership Integration**: Understanding of Kyai influence patterns
- **Kerapan Sapi Cultural Context**: Bull racing traditions and social significance
- **Traditional Governance**: Village decision-making processes
- **Economic Pattern Analysis**: Local business customs and practices

### Technical Features
- **Quick Analysis**: Rule-based local processing for immediate insights
- **Enhanced Analysis**: LLM-powered comprehensive recommendations
- **Multi-format Export**: Professional document generation
- **Audit Trail**: Complete activity logging for compliance
- **Real-time Updates**: Dynamic content without page refreshes

## 🔧 Configuration Options

### Analysis Settings
- **Quick Analysis**: Uses TensorFlow.js for fast local processing
- **Enhanced Analysis**: Integrates with OpenRouter API for advanced insights
- **Cost Control**: Configurable daily limits and budget controls

### Security Settings
- **Rate Limiting**: Configurable per-minute request limits
- **Session Security**: Customizable timeout and cookie settings
- **File Upload**: Configurable size limits and type restrictions

### Cultural Settings
- **Context Adaptation**: Sampang-specific cultural parameters
- **Language Support**: Indonesian and Madurese language elements
- **Religious Calendar**: Islamic observance integration

## 🛡️ Security Best Practices

### Development Security
- All user inputs are sanitized and validated
- SQL queries use prepared statements exclusively
- Passwords are hashed with bcrypt
- Sessions use secure, HTTP-only cookies
- File uploads are restricted and validated

### Production Security
- Enable HTTPS and update security headers
- Set strong session secrets and encryption keys
- Configure proper file permissions
- Enable security logging and monitoring
- Regular security updates and patches

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth.php` - Login, register, logout
- `GET /api/auth.php` - Check authentication status

### Project Management
- `GET /api/projects.php` - List user projects
- `POST /api/projects.php` - Create new project
- `PUT /api/projects.php?id={id}` - Update project
- `DELETE /api/projects.php?id={id}` - Delete project

### Recommendations
- `GET /api/recommendations.php` - List recommendations
- `POST /api/recommendations.php` - Generate new recommendation
- `POST /api/recommendations.php` - Submit feedback

### Knowledge Base
- `GET /api/knowledge.php` - List knowledge sources
- `POST /api/knowledge.php` - Add knowledge source
- `DELETE /api/knowledge.php?id={id}` - Remove knowledge source

## 🏃‍♂️ Quick Start

1. **Install XAMPP** and start Apache + MySQL
2. **Copy files** to `htdocs/exeloka/v1/`
3. **Import database** from `database/schema.sql`
4. **Configure** database credentials in `.env`
5. **Access** `http://localhost/exeloka/v1/`
6. **Register** a new account or use test accounts
7. **Create** your first cultural engagement project
8. **Generate** AI-powered recommendations
9. **Export** professional reports

## 📞 Support & Maintenance

### Regular Maintenance
- Database backups (automated daily)
- Log rotation (configurable retention)
- Security updates (monthly review)
- Performance monitoring (built-in metrics)

### Troubleshooting
- Check Apache error logs: `C:\xampp\apache\logs\error.log`
- Check application logs: `logs/php_errors.log`
- Verify database connections in phpMyAdmin
- Test API endpoints with browser developer tools

## 🌟 Cultural Sensitivity Note
This system has been designed with deep respect for Sampang's cultural heritage and Islamic values. All recommendations and analysis are provided to help organizations build genuine, respectful relationships with local communities while preserving and honoring traditional practices.

---

**Exeloka v1** - Building bridges between businesses and communities through cultural wisdom.