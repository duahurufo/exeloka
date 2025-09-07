<?php
/**
 * Exeloka v1 - Knowledge Management API
 * Secure knowledge sources endpoints
 */

// Define access constant before including config
define('EXELOKA_ACCESS', true);

// Debug: check if constant is defined
if (!defined('EXELOKA_ACCESS')) {
    die('EXELOKA_ACCESS not defined');
}

require_once __DIR__ . '/config.php';

setCorsHeaders();
checkRateLimit();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getKnowledgeSource($pdo, $_GET['id']);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'categories') {
            getCategories($pdo);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'search') {
            searchKnowledge($pdo);
        } else {
            getKnowledgeSources($pdo);
        }
        break;
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'upload') {
            uploadKnowledge($pdo);
        } else {
            addKnowledgeSource($pdo);
        }
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            updateKnowledgeSource($pdo, $_GET['id']);
        } else {
            jsonResponse(['error' => 'Knowledge source ID required'], 400);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteKnowledgeSource($pdo, $_GET['id']);
        } else {
            jsonResponse(['error' => 'Knowledge source ID required'], 400);
        }
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function getKnowledgeSources($pdo) {
    try {
        $userId = getCurrentUserId();
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $query = "
            SELECT ks.*, kc.name as category_name, kc.color as category_color,
                   COUNT(ksu.id) as usage_count
            FROM knowledge_sources ks
            LEFT JOIN knowledge_categories kc ON ks.category_id = kc.id
            LEFT JOIN knowledge_source_usage ksu ON ks.id = ksu.knowledge_source_id
            WHERE ks.user_id = ? OR ks.is_public = 1
        ";
        $params = [$userId];
        
        if ($category) {
            $query .= " AND ks.category_id = ?";
            $params[] = $category;
        }
        
        if ($search) {
            $query .= " AND (ks.title LIKE ? OR ks.content LIKE ? OR ks.tags LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        $query .= " GROUP BY ks.id ORDER BY ks.importance_score DESC, ks.created_at DESC LIMIT ? OFFSET ?";
        $params = array_merge($params, [$limit, $offset]);
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process JSON fields
        foreach ($sources as &$source) {
            $source['tags'] = $source['tags'] ? json_decode($source['tags']) : [];
            $source['metadata'] = $source['metadata'] ? json_decode($source['metadata']) : [];
            $source['usage_count'] = (int)$source['usage_count'];
            $source['importance_score'] = (int)$source['importance_score'];
        }
        
        // Get total count for pagination
        $countQuery = "SELECT COUNT(*) as total FROM knowledge_sources WHERE user_id = ? OR is_public = 1";
        $countParams = [$userId];
        
        if ($category) {
            $countQuery .= " AND category_id = ?";
            $countParams[] = $category;
        }
        
        if ($search) {
            $countQuery .= " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)";
            $countParams = array_merge($countParams, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        $stmt = $pdo->prepare($countQuery);
        $stmt->execute($countParams);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        jsonResponse([
            'success' => true,
            'data' => $sources,
            'pagination' => [
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function getKnowledgeSource($pdo, $id) {
    try {
        $userId = getCurrentUserId();
        $stmt = $pdo->prepare("
            SELECT ks.*, kc.name as category_name, kc.color as category_color
            FROM knowledge_sources ks
            LEFT JOIN knowledge_categories kc ON ks.category_id = kc.id
            WHERE ks.id = ? AND (ks.user_id = ? OR ks.is_public = 1)
        ");
        $stmt->execute([$id, $userId]);
        $source = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$source) {
            jsonResponse(['error' => 'Knowledge source not found'], 404);
        }
        
        // Process JSON fields
        $source['tags'] = $source['tags'] ? json_decode($source['tags']) : [];
        $source['metadata'] = $source['metadata'] ? json_decode($source['metadata']) : [];
        
        // Record usage
        $stmt = $pdo->prepare("INSERT INTO knowledge_source_usage (knowledge_source_id, user_id, access_type) VALUES (?, ?, 'view')");
        $stmt->execute([$id, $userId]);
        
        jsonResponse(['success' => true, 'data' => $source]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function addKnowledgeSource($pdo) {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $source_type = $data['source_type'] ?? 'text';
    $source_url = $data['source_url'] ?? null;
    $category_id = $data['category_id'] ?? null;
    $tags = json_encode($data['tags'] ?? []);
    $importance_score = $data['importance_score'] ?? 5;
    $is_public = $data['is_public'] ?? 0;
    $metadata = json_encode($data['metadata'] ?? []);
    
    if (empty($title)) {
        jsonResponse(['error' => 'Title is required'], 400);
    }
    
    if (empty($content) && empty($source_url)) {
        jsonResponse(['error' => 'Content or source URL is required'], 400);
    }
    
    try {
        // If URL is provided, extract content
        if ($source_url && empty($content)) {
            $content = extractContentFromUrl($source_url);
            if (!$content) {
                jsonResponse(['error' => 'Failed to extract content from URL'], 400);
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO knowledge_sources (
                user_id, title, content, source_type, source_url, category_id,
                tags, importance_score, is_public, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId, $title, $content, $source_type, $source_url, $category_id,
            $tags, $importance_score, $is_public, $metadata
        ]);
        
        $sourceId = $pdo->lastInsertId();
        
        jsonResponse([
            'success' => true,
            'message' => 'Knowledge source added successfully',
            'data' => ['id' => $sourceId]
        ]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function uploadKnowledge($pdo) {
    $userId = getCurrentUserId();
    
    if (!isset($_FILES['file'])) {
        jsonResponse(['error' => 'No file uploaded'], 400);
    }
    
    $file = $_FILES['file'];
    $title = $_POST['title'] ?? '';
    $category_id = $_POST['category_id'] ?? null;
    $importance_score = $_POST['importance_score'] ?? 5;
    
    if (empty($title)) {
        jsonResponse(['error' => 'Title is required'], 400);
    }
    
    // Validate file
    $allowedTypes = ['txt', 'pdf', 'doc', 'docx', 'md'];
    $fileInfo = pathinfo($file['name']);
    $extension = strtolower($fileInfo['extension']);
    
    if (!in_array($extension, $allowedTypes)) {
        jsonResponse(['error' => 'Invalid file type. Allowed: ' . implode(', ', $allowedTypes)], 400);
    }
    
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
        jsonResponse(['error' => 'File too large. Maximum size: 10MB'], 400);
    }
    
    try {
        // Create upload directory if it doesn't exist
        $uploadDir = '../uploads/knowledge/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $filename = uniqid() . '_' . $fileInfo['filename'] . '.' . $extension;
        $filePath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            jsonResponse(['error' => 'Failed to upload file'], 500);
        }
        
        // Extract content based on file type
        $content = extractContentFromFile($filePath, $extension);
        
        $metadata = json_encode([
            'filename' => $file['name'],
            'file_path' => $filePath,
            'file_size' => $file['size'],
            'mime_type' => $file['type']
        ]);
        
        $stmt = $pdo->prepare("
            INSERT INTO knowledge_sources (
                user_id, title, content, source_type, category_id,
                importance_score, metadata
            ) VALUES (?, ?, ?, 'file', ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId, $title, $content, $category_id, $importance_score, $metadata
        ]);
        
        $sourceId = $pdo->lastInsertId();
        
        jsonResponse([
            'success' => true,
            'message' => 'File uploaded and processed successfully',
            'data' => ['id' => $sourceId]
        ]);
        
    } catch(Exception $e) {
        jsonResponse(['error' => 'Processing failed: ' . $e->getMessage()], 500);
    }
}

function getCategories($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM knowledge_categories ORDER BY name");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse(['success' => true, 'data' => $categories]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function searchKnowledge($pdo) {
    $userId = getCurrentUserId();
    $query = $_GET['q'] ?? '';
    $category = $_GET['category'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    
    if (empty($query)) {
        jsonResponse(['error' => 'Search query is required'], 400);
    }
    
    try {
        // Full-text search with relevance scoring
        $sql = "
            SELECT ks.*, kc.name as category_name, kc.color as category_color,
                   MATCH(ks.title, ks.content, ks.tags) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score
            FROM knowledge_sources ks
            LEFT JOIN knowledge_categories kc ON ks.category_id = kc.id
            WHERE (ks.user_id = ? OR ks.is_public = 1)
            AND MATCH(ks.title, ks.content, ks.tags) AGAINST(? IN NATURAL LANGUAGE MODE)
        ";
        $params = [$query, $userId, $query];
        
        if ($category) {
            $sql .= " AND ks.category_id = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY relevance_score DESC, ks.importance_score DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process results
        foreach ($results as &$result) {
            $result['tags'] = $result['tags'] ? json_decode($result['tags']) : [];
            $result['relevance_score'] = (float)$result['relevance_score'];
            
            // Highlight search terms in content (basic implementation)
            $result['highlighted_content'] = highlightSearchTerms($result['content'], $query);
        }
        
        jsonResponse(['success' => true, 'data' => $results]);
    } catch(PDOException $e) {
        // Fallback to LIKE search if full-text search fails
        $sql = "
            SELECT ks.*, kc.name as category_name, kc.color as category_color
            FROM knowledge_sources ks
            LEFT JOIN knowledge_categories kc ON ks.category_id = kc.id
            WHERE (ks.user_id = ? OR ks.is_public = 1)
            AND (ks.title LIKE ? OR ks.content LIKE ? OR ks.tags LIKE ?)
        ";
        $searchTerm = "%{$query}%";
        $params = [$userId, $searchTerm, $searchTerm, $searchTerm];
        
        if ($category) {
            $sql .= " AND ks.category_id = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY ks.importance_score DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as &$result) {
            $result['tags'] = $result['tags'] ? json_decode($result['tags']) : [];
            $result['highlighted_content'] = highlightSearchTerms($result['content'], $query);
        }
        
        jsonResponse(['success' => true, 'data' => $results]);
    }
}

function deleteKnowledgeSource($pdo, $id) {
    $userId = getCurrentUserId();
    
    try {
        // Get file path before deletion (if it's a file)
        $stmt = $pdo->prepare("SELECT metadata FROM knowledge_sources WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $source = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$source) {
            jsonResponse(['error' => 'Knowledge source not found'], 404);
        }
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM knowledge_sources WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        // Delete physical file if exists
        if ($source['metadata']) {
            $metadata = json_decode($source['metadata'], true);
            if (isset($metadata['file_path']) && file_exists($metadata['file_path'])) {
                unlink($metadata['file_path']);
            }
        }
        
        jsonResponse(['success' => true, 'message' => 'Knowledge source deleted successfully']);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

// Helper functions
function extractContentFromUrl($url) {
    // Basic URL content extraction
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'user_agent' => 'Mozilla/5.0 (compatible; Exeloka/1.0)'
        ]
    ]);
    
    $content = @file_get_contents($url, false, $context);
    if ($content === false) {
        return null;
    }
    
    // Basic HTML stripping
    $content = strip_tags($content);
    $content = html_entity_decode($content);
    $content = preg_replace('/\s+/', ' ', $content);
    
    return trim($content);
}

function extractContentFromFile($filePath, $extension) {
    switch ($extension) {
        case 'txt':
        case 'md':
            return file_get_contents($filePath);
        
        case 'pdf':
            // Basic PDF text extraction (requires pdftotext or similar)
            if (function_exists('shell_exec')) {
                $output = shell_exec("pdftotext '$filePath' -");
                return $output ?: 'PDF content could not be extracted';
            }
            return 'PDF uploaded - content extraction not available';
        
        case 'doc':
        case 'docx':
            // For production, you'd use a proper library like PhpSpreadsheet
            return 'Document uploaded - content will be processed';
        
        default:
            return 'File uploaded successfully';
    }
}

function highlightSearchTerms($content, $query) {
    $terms = explode(' ', $query);
    $highlighted = $content;
    
    foreach ($terms as $term) {
        if (strlen($term) > 2) {
            $highlighted = preg_replace(
                '/(' . preg_quote($term, '/') . ')/i',
                '<mark>$1</mark>',
                $highlighted
            );
        }
    }
    
    return $highlighted;
}
?>