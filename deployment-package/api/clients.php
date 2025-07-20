<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$database = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'hY9cq6KT3$';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Extract client ID from URL if present
$clientId = null;
if (isset($_GET['id'])) {
    $clientId = $_GET['id'];
}

if ($method === 'GET') {
    // Get all clients or specific client
    try {
        if ($clientId) {
            // Get specific client
            $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
            $stmt->execute([$clientId]);
            $client = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$client) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                exit;
            }
            
            // Parse pets JSON
            $client['pets'] = json_decode($client['pets'], true) ?? [];
            
            echo json_encode($client);
        } else {
            // Get all clients with optional search
            $search = $_GET['search'] ?? '';
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 20);
            $offset = ($page - 1) * $limit;
            
            $whereClause = '';
            $params = [];
            
            if ($search) {
                $whereClause = 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?';
                $searchParam = '%' . $search . '%';
                $params = [$searchParam, $searchParam, $searchParam, $searchParam];
            }
            
            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM clients $whereClause";
            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get clients
            $sql = "SELECT * FROM clients $whereClause ORDER BY name ASC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse pets JSON for each client
            $clients = array_map(function($client) {
                $client['pets'] = json_decode($client['pets'], true) ?? [];
                return $client;
            }, $clients);
            
            echo json_encode([
                'clients' => $clients,
                'total' => $totalCount,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($totalCount / $limit)
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'POST') {
    // Create new client
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['phone']) || !isset($input['address'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: name, email, phone, address']);
        exit;
    }
    
    try {
        // Check if email already exists
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE email = ?');
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            exit;
        }
        
        // Prepare pets data
        $pets = isset($input['pets']) ? json_encode($input['pets']) : json_encode([]);
        
        // Insert new client
        $stmt = $pdo->prepare('
            INSERT INTO clients (name, email, phone, address, pets, notes, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['address'],
            $pets,
            $input['notes'] ?? null
        ]);
        
        $clientId = $pdo->lastInsertId();
        
        // Return the created client
        $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        $client['pets'] = json_decode($client['pets'], true) ?? [];
        
        echo json_encode(['message' => 'Client created successfully', 'client' => $client]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create client: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'PUT') {
    // Update existing client
    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Client ID required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if client exists
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE id = ?');
        $stmt->execute([$clientId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Client not found']);
            exit;
        }
        
        // Check if email is being changed and if new email already exists
        if (isset($input['email'])) {
            $stmt = $pdo->prepare('SELECT id FROM clients WHERE email = ? AND id != ?');
            $stmt->execute([$input['email'], $clientId]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Email already exists']);
                exit;
            }
        }
        
        // Build update query dynamically
        $fields = [];
        $values = [];
        
        if (isset($input['name'])) {
            $fields[] = 'name = ?';
            $values[] = $input['name'];
        }
        if (isset($input['email'])) {
            $fields[] = 'email = ?';
            $values[] = $input['email'];
        }
        if (isset($input['phone'])) {
            $fields[] = 'phone = ?';
            $values[] = $input['phone'];
        }
        if (isset($input['address'])) {
            $fields[] = 'address = ?';
            $values[] = $input['address'];
        }
        if (isset($input['pets'])) {
            $fields[] = 'pets = ?';
            $values[] = json_encode($input['pets']);
        }
        if (isset($input['notes'])) {
            $fields[] = 'notes = ?';
            $values[] = $input['notes'];
        }
        
        $fields[] = 'updatedAt = NOW()';
        $values[] = $clientId;
        
        $sql = 'UPDATE clients SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        // Return the updated client
        $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        $client['pets'] = json_decode($client['pets'], true) ?? [];
        
        echo json_encode(['message' => 'Client updated successfully', 'client' => $client]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update client: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'DELETE') {
    // Delete client
    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Client ID required']);
        exit;
    }
    
    try {
        // Check if client has appointments
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE clientId = ?');
        $stmt->execute([$clientId]);
        $appointmentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($appointmentCount > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Cannot delete client with existing appointments']);
            exit;
        }
        
        // Delete client
        $stmt = $pdo->prepare('DELETE FROM clients WHERE id = ?');
        $stmt->execute([$clientId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Client not found']);
            exit;
        }
        
        echo json_encode(['message' => 'Client deleted successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete client: ' . $e->getMessage()]);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
