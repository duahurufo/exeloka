<?php
/**
 * Exeloka v1 - Document Management API
 * Secure file upload and document handling
 */

// Define access constant before including config
define('EXELOKA_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
checkRateLimit();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

// File upload configuration
$ALLOWED_TYPES = [
    // Documents
    'application/pdf' => ['pdf', 10485760], // 10MB
    'application/msword' => ['doc', 5242880], // 5MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx', 5242880],
    'application/vnd.ms-excel' => ['xls', 5242880],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx', 5242880],
    'application/vnd.ms-powerpoint' => ['ppt', 10485760], // 10MB
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' => ['pptx', 10485760],
    'text/plain' => ['txt', 1048576], // 1MB
    
    // Images
    'image/jpeg' => ['jpg', 5242880], // 5MB
    'image/png' => ['png', 5242880],
    'image/gif' => ['gif', 2097152], // 2MB
];

$MAX_TOTAL_SIZE = 52428800; // 50MB total per user

switch($method) {
    case 'POST':
        if (isset($_FILES['file'])) {
            uploadDocument($pdo);
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $action = $data['action'] ?? '';
            
            switch($action) {
                case 'create_manual':
                    createManualDocument($pdo, $data);
                    break;
                case 'link_to_project':
                    linkDocumentToProject($pdo, $data);
                    break;
                default:
                    jsonResponse(['error' => 'Invalid action'], 400);
            }
        }
        break;
    
    case 'GET':
        if (isset($_GET['id'])) {
            if (isset($_GET['download'])) {
                downloadDocument($pdo, $_GET['id']);
            } else {
                getDocument($pdo, $_GET['id']);
            }
        } else {
            getDocuments($pdo);
        }
        break;
    
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteDocument($pdo, $_GET['id']);
        } else {
            jsonResponse(['error' => 'Document ID required'], 400);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function uploadDocument($pdo) {
    global $ALLOWED_TYPES, $MAX_TOTAL_SIZE;
    
    $userId = requireAuth();
    
    try {
        // Validate file upload
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $error = $_FILES['file']['error'] ?? 'Unknown error';
            logSecurityEvent('file_upload_error', ['error' => $error, 'user_id' => $userId]);
            jsonResponse(['error' => 'File upload failed: ' . getUploadErrorMessage($error)], 400);
        }
        
        $file = $_FILES['file'];
        $originalName = sanitizeInput($file['name']);
        $fileSize = $file['size'];
        $tempPath = $file['tmp_name'];
        
        // Validate file type
        $mimeType = mime_content_type($tempPath);
        if (!isset($ALLOWED_TYPES[$mimeType])) {
            logSecurityEvent('file_upload_invalid_type', [
                'mime_type' => $mimeType,
                'filename' => $originalName,
                'user_id' => $userId
            ]);
            jsonResponse(['error' => 'File type not allowed: ' . $mimeType], 400);
        }
        
        $allowedExtensions = $ALLOWED_TYPES[$mimeType][0];
        $maxSize = $ALLOWED_TYPES[$mimeType][1];
        
        // Validate file size
        if ($fileSize > $maxSize) {
            jsonResponse(['error' => 'File too large. Maximum size: ' . formatBytes($maxSize)], 400);
        }
        
        // Check total user storage limit
        $stmt = $pdo->prepare("SELECT SUM(file_size) as total_size FROM documents WHERE user_id = ?");
        $stmt->execute([$userId]);
        $totalSize = $stmt->fetchColumn() ?: 0;
        
        if ($totalSize + $fileSize > $MAX_TOTAL_SIZE) {
            jsonResponse(['error' => 'Storage quota exceeded. Total limit: ' . formatBytes($MAX_TOTAL_SIZE)], 400);
        }
        
        // Generate secure filename
        $fileHash = hash_file('sha256', $tempPath);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $storedName = $fileHash . '.' . $extension;
        
        // Check for duplicate files
        $stmt = $pdo->prepare("SELECT id, original_name FROM documents WHERE file_hash = ?");
        $stmt->execute([$fileHash]);
        $existingFile = $stmt->fetch();
        
        if ($existingFile) {
            jsonResponse([
                'message' => 'File already exists',
                'document_id' => $existingFile['id'],
                'original_name' => $existingFile['original_name']
            ]);
        }
        
        // Determine storage path based on context
        $context = sanitizeInput($_POST['context'] ?? 'user_files');
        $validContexts = ['knowledge', 'projects', 'user_files'];
        $context = in_array($context, $validContexts) ? $context : 'user_files';
        
        $uploadDir = __DIR__ . '/../uploads/documents/' . $context . '/';
        $filePath = 'uploads/documents/' . $context . '/' . $storedName;
        
        // Ensure upload directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Move uploaded file
        if (!move_uploaded_file($tempPath, $uploadDir . $storedName)) {
            jsonResponse(['error' => 'Failed to save uploaded file'], 500);
        }
        
        // Extract text content if possible
        $extractedText = extractTextFromFile($uploadDir . $storedName, $mimeType);
        
        // Save to database
        $stmt = $pdo->prepare("
            INSERT INTO documents (
                user_id, original_name, stored_name, file_path, file_size, 
                mime_type, file_hash, storage_type, extracted_text, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'local', ?, ?)
        ");
        
        $metadata = json_encode([
            'upload_ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'upload_context' => $context,
            'original_extension' => $extension
        ]);
        
        $stmt->execute([
            $userId, $originalName, $storedName, $filePath, $fileSize,
            $mimeType, $fileHash, $extractedText, $metadata
        ]);
        
        $documentId = $pdo->lastInsertId();
        
        logSecurityEvent('file_uploaded', [
            'document_id' => $documentId,
            'filename' => $originalName,
            'size' => $fileSize,
            'type' => $mimeType,
            'user_id' => $userId
        ]);
        
        jsonResponse([
            'message' => 'File uploaded successfully',
            'document_id' => $documentId,
            'original_name' => $originalName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'extracted_text_length' => strlen($extractedText ?: '')
        ]);
        
    } catch(Exception $e) {
        error_log("File upload error: " . $e->getMessage());
        jsonResponse(['error' => 'Upload failed'], 500);
    }
}

function createManualDocument($pdo, $data) {
    $userId = requireAuth();
    
    $title = sanitizeInput($data['title'] ?? '');
    $content = sanitizeInput($data['content'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $tags = $data['tags'] ?? [];
    
    if (empty($title) || empty($content)) {
        jsonResponse(['error' => 'Title and content are required'], 400);
    }
    
    try {
        // Create a pseudo-document record for manual content
        $fileHash = hash('sha256', $content . time() . $userId);
        
        $stmt = $pdo->prepare("
            INSERT INTO documents (
                user_id, original_name, stored_name, file_path, file_size,
                mime_type, file_hash, storage_type, extracted_text, metadata
            ) VALUES (?, ?, ?, ?, ?, 'text/plain', ?, 'manual', ?, ?)
        ");
        
        $metadata = json_encode([
            'type' => 'manual_entry',
            'description' => $description,
            'tags' => $tags,
            'created_ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        $stmt->execute([
            $userId,
            $title,
            'manual_' . $fileHash . '.txt',
            'manual/' . $fileHash,
            strlen($content),
            $fileHash,
            $content,
            $metadata
        ]);
        
        $documentId = $pdo->lastInsertId();
        
        jsonResponse([
            'message' => 'Manual document created successfully',
            'document_id' => $documentId,
            'title' => $title,
            'content_length' => strlen($content)
        ]);
        
    } catch(PDOException $e) {
        error_log("Manual document creation error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to create document'], 500);
    }
}

function getDocuments($pdo) {
    $userId = requireAuth();
    
    $page = (int)($_GET['page'] ?? 1);
    $limit = min((int)($_GET['limit'] ?? 20), 100);
    $offset = ($page - 1) * $limit;
    
    $filter = sanitizeInput($_GET['filter'] ?? '');
    $type = sanitizeInput($_GET['type'] ?? '');
    
    try {
        $whereClause = "WHERE d.user_id = ?";
        $params = [$userId];
        
        if ($type && $type !== 'all') {
            $whereClause .= " AND d.mime_type LIKE ?";
            $params[] = $type . '%';
        }
        
        if ($filter) {
            $whereClause .= " AND (d.original_name LIKE ? OR d.extracted_text LIKE ?)";
            $params[] = '%' . $filter . '%';
            $params[] = '%' . $filter . '%';
        }
        
        // Get total count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM documents d " . $whereClause);
        $stmt->execute($params);
        $totalCount = $stmt->fetchColumn();
        
        // Get documents
        $sql = "
            SELECT d.*, 
                   COUNT(pf.id) as project_count,
                   COUNT(ks.id) as knowledge_count
            FROM documents d
            LEFT JOIN project_files pf ON d.id = pf.document_id
            LEFT JOIN knowledge_sources ks ON d.id = ks.document_id
            " . $whereClause . "
            GROUP BY d.id
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $documents = $stmt->fetchAll();
        
        // Process results
        foreach ($documents as &$doc) {
            $doc['metadata'] = json_decode($doc['metadata'] ?? '{}', true);
            $doc['file_size_formatted'] = formatBytes($doc['file_size']);
            $doc['project_count'] = (int)$doc['project_count'];
            $doc['knowledge_count'] = (int)$doc['knowledge_count'];
            
            // Remove sensitive info
            unset($doc['file_path'], $doc['file_hash'], $doc['extracted_text']);
        }
        
        jsonResponse([
            'documents' => $documents,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalCount / $limit),
                'total_count' => $totalCount,
                'per_page' => $limit
            ]
        ]);
        
    } catch(PDOException $e) {
        error_log("Get documents error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to retrieve documents'], 500);
    }
}

function getDocument($pdo, $id) {
    $userId = requireAuth();
    
    try {
        $stmt = $pdo->prepare("
            SELECT d.*, 
                   COUNT(DISTINCT pf.project_id) as project_count,
                   COUNT(DISTINCT ks.id) as knowledge_count
            FROM documents d
            LEFT JOIN project_files pf ON d.id = pf.document_id
            LEFT JOIN knowledge_sources ks ON d.id = ks.document_id
            WHERE d.id = ? AND d.user_id = ?
            GROUP BY d.id
        ");
        $stmt->execute([$id, $userId]);
        $document = $stmt->fetch();
        
        if (!$document) {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        
        // Update last accessed
        $stmt = $pdo->prepare("UPDATE documents SET last_accessed = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        
        $document['metadata'] = json_decode($document['metadata'] ?? '{}', true);
        $document['file_size_formatted'] = formatBytes($document['file_size']);
        $document['project_count'] = (int)$document['project_count'];
        $document['knowledge_count'] = (int)$document['knowledge_count'];
        
        jsonResponse($document);
        
    } catch(PDOException $e) {
        error_log("Get document error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to retrieve document'], 500);
    }
}

function downloadDocument($pdo, $id) {
    $userId = requireAuth();
    
    try {
        $stmt = $pdo->prepare("
            SELECT original_name, stored_name, file_path, mime_type, file_size
            FROM documents 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $userId]);
        $document = $stmt->fetch();
        
        if (!$document) {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        
        $filePath = __DIR__ . '/../' . $document['file_path'];
        
        if (!file_exists($filePath)) {
            jsonResponse(['error' => 'File not found on disk'], 404);
        }
        
        // Update download count
        $stmt = $pdo->prepare("UPDATE documents SET download_count = download_count + 1, last_accessed = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        
        // Set headers for file download
        header('Content-Type: ' . $document['mime_type']);
        header('Content-Disposition: attachment; filename="' . addslashes($document['original_name']) . '"');
        header('Content-Length: ' . $document['file_size']);
        header('Cache-Control: private');
        
        // Output file
        readfile($filePath);
        exit;
        
    } catch(PDOException $e) {
        error_log("Download document error: " . $e->getMessage());
        jsonResponse(['error' => 'Download failed'], 500);
    }
}

function linkDocumentToProject($pdo, $data) {
    $userId = requireAuth();
    
    $documentId = (int)($data['document_id'] ?? 0);
    $projectId = (int)($data['project_id'] ?? 0);
    $context = sanitizeInput($data['context'] ?? 'attachment');
    
    if (!$documentId || !$projectId) {
        jsonResponse(['error' => 'Document ID and Project ID are required'], 400);
    }
    
    try {
        // Verify document ownership
        $stmt = $pdo->prepare("SELECT id FROM documents WHERE id = ? AND user_id = ?");
        $stmt->execute([$documentId, $userId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Document not found or access denied'], 404);
        }
        
        // Verify project ownership (assuming projects table exists)
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$projectId, $userId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Project not found or access denied'], 404);
        }
        
        // Check if link already exists
        $stmt = $pdo->prepare("SELECT id FROM project_files WHERE document_id = ? AND project_id = ?");
        $stmt->execute([$documentId, $projectId]);
        if ($stmt->fetch()) {
            jsonResponse(['message' => 'Document already linked to project']);
        }
        
        // Create link
        $stmt = $pdo->prepare("
            INSERT INTO project_files (document_id, project_id, context, linked_by)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$documentId, $projectId, $context, $userId]);
        
        jsonResponse([
            'message' => 'Document linked to project successfully',
            'document_id' => $documentId,
            'project_id' => $projectId,
            'context' => $context
        ]);
        
    } catch(PDOException $e) {
        error_log("Link document error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to link document to project'], 500);
    }
}

function deleteDocument($pdo, $id) {
    $userId = requireAuth();
    
    try {
        // Get document info
        $stmt = $pdo->prepare("SELECT file_path, original_name FROM documents WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $document = $stmt->fetch();
        
        if (!$document) {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        
        // Check if document is being used
        $stmt = $pdo->prepare("
            SELECT 
                (SELECT COUNT(*) FROM project_files WHERE document_id = ?) as project_usage,
                (SELECT COUNT(*) FROM knowledge_sources WHERE document_id = ?) as knowledge_usage
        ");
        $stmt->execute([$id, $id]);
        $usage = $stmt->fetch();
        
        if ($usage['project_usage'] > 0 || $usage['knowledge_usage'] > 0) {
            jsonResponse([
                'error' => 'Document is in use',
                'project_usage' => (int)$usage['project_usage'],
                'knowledge_usage' => (int)$usage['knowledge_usage']
            ], 400);
        }
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() > 0) {
            // Delete physical file
            $filePath = __DIR__ . '/../' . $document['file_path'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            
            logSecurityEvent('document_deleted', [
                'document_id' => $id,
                'filename' => $document['original_name'],
                'user_id' => $userId
            ]);
            
            jsonResponse(['message' => 'Document deleted successfully']);
        } else {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        
    } catch(PDOException $e) {
        error_log("Delete document error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to delete document'], 500);
    }
}

// Helper functions
function extractTextFromFile($filePath, $mimeType) {
    try {
        switch($mimeType) {
            case 'text/plain':
                return file_get_contents($filePath);
                
            case 'application/pdf':
                return extractPDFText($filePath);
                
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return extractWordText($filePath);
                
            case 'image/jpeg':
            case 'image/png':
            case 'image/gif':
                return extractImageText($filePath);
                
            case 'text/html':
                return extractHTMLText($filePath);
                
            default:
                return null;
        }
    } catch (Exception $e) {
        error_log("Text extraction error: " . $e->getMessage());
        return "Error extracting text: " . $e->getMessage();
    }
}

function extractPDFText($filePath) {
    // Method 1: Try using pdftotext (poppler-utils)
    if (command_exists('pdftotext')) {
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_extract_');
        $command = escapeshellcmd('pdftotext') . ' ' . escapeshellarg($filePath) . ' ' . escapeshellarg($tempFile);
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0 && file_exists($tempFile)) {
            $text = file_get_contents($tempFile);
            unlink($tempFile);
            return trim($text);
        }
    }
    
    // Method 2: Try using Python with PyMuPDF (if available)
    if (command_exists('python')) {
        $pythonScript = __DIR__ . '/../utils/pdf_extractor.py';
        if (file_exists($pythonScript)) {
            $command = escapeshellcmd('python') . ' ' . escapeshellarg($pythonScript) . ' ' . escapeshellarg($filePath);
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                return implode("\n", $output);
            }
        }
    }
    
    // Method 3: Basic PHP PDF text extraction (limited)
    return extractPDFTextBasic($filePath);
}

function extractPDFTextBasic($filePath) {
    $content = file_get_contents($filePath);
    if (!$content) return '';
    
    // Very basic PDF text extraction - finds text between stream markers
    $text = '';
    if (preg_match_all('/stream\s*\n(.*?)\nendstream/s', $content, $matches)) {
        foreach ($matches[1] as $stream) {
            // Decode simple text streams
            $decoded = @gzuncompress($stream);
            if ($decoded !== false) {
                // Extract readable text
                if (preg_match_all('/\((.*?)\)/', $decoded, $textMatches)) {
                    $text .= implode(' ', $textMatches[1]) . "\n";
                }
            }
        }
    }
    
    return trim($text) ?: 'PDF text extraction requires additional libraries (poppler-utils or PyMuPDF)';
}

function extractWordText($filePath) {
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    
    if ($extension === 'docx') {
        return extractDocxText($filePath);
    } else {
        return 'Legacy DOC format requires additional libraries (antiword or python-docx)';
    }
}

function extractDocxText($filePath) {
    try {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== TRUE) {
            return 'Error: Cannot open DOCX file';
        }
        
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        
        if (!$xml) {
            return 'Error: Cannot read document content';
        }
        
        // Parse XML and extract text
        $dom = new DOMDocument();
        $dom->loadXML($xml);
        
        $text = '';
        $xpath = new DOMXPath($dom);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
        
        $textNodes = $xpath->query('//w:t');
        foreach ($textNodes as $textNode) {
            $text .= $textNode->textContent . ' ';
        }
        
        return trim($text);
        
    } catch (Exception $e) {
        return 'Error extracting DOCX: ' . $e->getMessage();
    }
}

function extractImageText($filePath) {
    // Method 1: Try using Tesseract OCR
    if (command_exists('tesseract')) {
        $tempDir = sys_get_temp_dir();
        $outputBase = $tempDir . '/ocr_output_' . uniqid();
        $outputFile = $outputBase . '.txt';
        
        // Configure Tesseract for Indonesian and English
        $command = escapeshellcmd('tesseract') . ' ' . escapeshellarg($filePath) . ' ' . escapeshellarg($outputBase) . ' -l ind+eng --oem 3 --psm 6';
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0 && file_exists($outputFile)) {
            $text = file_get_contents($outputFile);
            unlink($outputFile);
            return trim($text);
        }
    }
    
    // Method 2: Try using Python with pytesseract
    if (command_exists('python')) {
        $pythonScript = __DIR__ . '/../utils/ocr_extractor.py';
        if (file_exists($pythonScript)) {
            $command = escapeshellcmd('python') . ' ' . escapeshellarg($pythonScript) . ' ' . escapeshellarg($filePath);
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                return implode("\n", $output);
            }
        }
    }
    
    return 'OCR text extraction requires Tesseract or Python with pytesseract';
}

function extractHTMLText($filePath) {
    $content = file_get_contents($filePath);
    if (!$content) return '';
    
    // Remove script and style elements
    $content = preg_replace('/<script[^>]*>.*?<\/script>/si', '', $content);
    $content = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $content);
    
    // Convert to plain text
    $text = strip_tags($content);
    $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
    $text = preg_replace('/\s+/', ' ', $text);
    
    return trim($text);
}

function extractURLContent($url) {
    try {
        // Validate URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception('Invalid URL format');
        }
        
        // Set up cURL with proper headers
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => 'Exeloka Cultural Wisdom Bot/1.0',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: id-ID,id;q=0.9,en;q=0.8',
                'Accept-Encoding: gzip, deflate',
                'Cache-Control: no-cache'
            ]
        ]);
        
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL error: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception('HTTP error: ' . $httpCode);
        }
        
        if (!$content) {
            throw new Exception('Empty response from URL');
        }
        
        // Handle different content types
        if (strpos($contentType, 'text/html') !== false) {
            return extractTextFromHTML($content);
        } elseif (strpos($contentType, 'text/plain') !== false) {
            return trim($content);
        } elseif (strpos($contentType, 'application/json') !== false) {
            $json = json_decode($content, true);
            return json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } else {
            return 'Content type not supported for text extraction: ' . $contentType;
        }
        
    } catch (Exception $e) {
        error_log("URL content extraction error: " . $e->getMessage());
        return 'Error extracting URL content: ' . $e->getMessage();
    }
}

function extractTextFromHTML($html) {
    // Parse HTML with DOMDocument for better extraction
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
    libxml_clear_errors();
    
    // Remove unwanted elements
    $unwanted = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'advertisement'];
    foreach ($unwanted as $tag) {
        $elements = $dom->getElementsByTagName($tag);
        for ($i = $elements->length - 1; $i >= 0; $i--) {
            $elements->item($i)->parentNode->removeChild($elements->item($i));
        }
    }
    
    // Extract text content, prioritizing article content
    $content = '';
    
    // Try to find main content areas
    $xpath = new DOMXPath($dom);
    $contentSelectors = [
        '//article',
        '//main',
        '//*[@class="content"]',
        '//*[@class="post-content"]',
        '//*[@class="entry-content"]',
        '//div[contains(@class, "content")]'
    ];
    
    $found = false;
    foreach ($contentSelectors as $selector) {
        $nodes = $xpath->query($selector);
        if ($nodes->length > 0) {
            foreach ($nodes as $node) {
                $content .= $node->textContent . "\n\n";
                $found = true;
            }
            break;
        }
    }
    
    // Fallback to body content
    if (!$found) {
        $body = $dom->getElementsByTagName('body')->item(0);
        if ($body) {
            $content = $body->textContent;
        }
    }
    
    // Clean up text
    $content = preg_replace('/\s+/', ' ', $content);
    $content = trim($content);
    
    return $content;
}

function command_exists($command) {
    $which = shell_exec("where $command 2>nul");
    return !empty($which);
}

function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB');
    
    for ($i = 0; $bytes > 1024; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

function getUploadErrorMessage($error) {
    switch($error) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'File too large';
        case UPLOAD_ERR_PARTIAL:
            return 'Upload incomplete';
        case UPLOAD_ERR_NO_FILE:
            return 'No file uploaded';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Missing temporary folder';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Cannot write to disk';
        case UPLOAD_ERR_EXTENSION:
            return 'Upload blocked by extension';
        default:
            return 'Unknown upload error';
    }
}
?>