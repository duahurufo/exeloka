<?php
/**
 * Exeloka v1 - Projects API
 * Secure project management endpoints
 */

// Define access constant before including config
define('EXELOKA_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
checkRateLimit();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getProject($pdo, $_GET['id']);
        } else {
            getProjects($pdo);
        }
        break;
    case 'POST':
        createProject($pdo);
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            updateProject($pdo, $_GET['id']);
        } else {
            jsonResponse(['error' => 'Project ID required'], 400);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteProject($pdo, $_GET['id']);
        } else {
            jsonResponse(['error' => 'Project ID required'], 400);
        }
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

function getProjects($pdo) {
    $userId = requireAuth();
    
    try {
        $stmt = $pdo->prepare("
            SELECT p.*, 
                   COUNT(r.id) as recommendation_count,
                   AVG(r.confidence_score) as avg_confidence
            FROM projects p
            LEFT JOIN recommendations r ON p.id = r.project_id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$userId]);
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process JSON fields
        foreach ($projects as &$project) {
            $project['objectives'] = json_decode($project['objectives'] ?? '[]');
            $project['stakeholders'] = json_decode($project['stakeholders'] ?? '[]');
            $project['priority_areas'] = json_decode($project['priority_areas'] ?? '[]');
            $project['recommendation_count'] = (int)$project['recommendation_count'];
            $project['avg_confidence'] = $project['avg_confidence'] ? round($project['avg_confidence'], 2) : null;
        }
        
        jsonResponse($projects);
    } catch(PDOException $e) {
        error_log("Get projects error: " . $e->getMessage());
        jsonResponse(['error' => 'Service temporarily unavailable'], 500);
    }
}

function getProject($pdo, $id) {
    try {
        $userId = getCurrentUserId();
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$project) {
            jsonResponse(['error' => 'Project not found'], 404);
        }
        
        // Process JSON fields
        $project['objectives'] = json_decode($project['objectives'] ?? '[]');
        $project['stakeholders'] = json_decode($project['stakeholders'] ?? '[]');
        $project['priority_areas'] = json_decode($project['priority_areas'] ?? '[]');
        
        // Get recommendations for this project
        $stmt = $pdo->prepare("SELECT * FROM recommendations WHERE project_id = ? ORDER BY created_at DESC");
        $stmt->execute([$id]);
        $recommendations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($recommendations as &$rec) {
            $rec['key_insights'] = json_decode($rec['key_insights'] ?? '[]');
            $rec['recommendations'] = json_decode($rec['recommendations'] ?? '[]');
            $rec['potential_risks'] = json_decode($rec['potential_risks'] ?? '[]');
            $rec['cultural_context'] = json_decode($rec['cultural_context'] ?? '[]');
            $rec['success_metrics'] = json_decode($rec['success_metrics'] ?? '[]');
        }
        
        $project['recommendations'] = $recommendations;
        
        jsonResponse(['success' => true, 'data' => $project]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function createProject($pdo) {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $title = $data['title'] ?? '';
    $description = $data['description'] ?? '';
    $project_type = $data['project_type'] ?? '';
    $cultural_context = $data['cultural_context'] ?? '';
    $objectives = json_encode($data['objectives'] ?? []);
    $stakeholders = json_encode($data['stakeholders'] ?? []);
    $priority_areas = json_encode($data['priority_areas'] ?? []);
    
    if (empty($title) || empty($description) || empty($project_type)) {
        jsonResponse(['error' => 'Title, description, and project type are required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO projects (
                user_id, title, description, project_type, cultural_context, 
                objectives, stakeholders, priority_areas, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planning')
        ");
        
        $stmt->execute([
            $userId, $title, $description, $project_type, $cultural_context,
            $objectives, $stakeholders, $priority_areas
        ]);
        
        $projectId = $pdo->lastInsertId();
        
        jsonResponse([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => ['id' => $projectId]
        ]);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function updateProject($pdo, $id) {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if project exists and belongs to user
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Project not found'], 404);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['title'])) {
            $updates[] = 'title = ?';
            $params[] = $data['title'];
        }
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
        }
        if (isset($data['status'])) {
            $updates[] = 'status = ?';
            $params[] = $data['status'];
        }
        if (isset($data['objectives'])) {
            $updates[] = 'objectives = ?';
            $params[] = json_encode($data['objectives']);
        }
        if (isset($data['stakeholders'])) {
            $updates[] = 'stakeholders = ?';
            $params[] = json_encode($data['stakeholders']);
        }
        if (isset($data['priority_areas'])) {
            $updates[] = 'priority_areas = ?';
            $params[] = json_encode($data['priority_areas']);
        }
        
        if (empty($updates)) {
            jsonResponse(['error' => 'No fields to update'], 400);
        }
        
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE projects SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);
        
        jsonResponse(['success' => true, 'message' => 'Project updated successfully']);
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}

function deleteProject($pdo, $id) {
    $userId = getCurrentUserId();
    
    try {
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() > 0) {
            jsonResponse(['success' => true, 'message' => 'Project deleted successfully']);
        } else {
            jsonResponse(['error' => 'Project not found'], 404);
        }
    } catch(PDOException $e) {
        jsonResponse(['error' => 'Database error'], 500);
    }
}
?>