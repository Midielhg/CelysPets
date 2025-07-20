<?php
// Client Management API - Based on appointments.php structure
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

if ($method === 'GET') {
    try {
        // Get clients with optional filters
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        $clientId = $_GET['id'] ?? null;
        
        if ($clientId) {
            // Get specific client with their appointments count
            $stmt = $pdo->prepare('
                SELECT c.*, 
                       COUNT(a.id) as appointment_count,
                       MAX(a.date) as last_appointment_date
                FROM clients c 
                LEFT JOIN appointments a ON c.id = a.clientId 
                WHERE c.id = ?
                GROUP BY c.id
            ');
            $stmt->execute([$clientId]);
            $client = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$client) {
                http_response_code(404);
                echo json_encode(['error' => 'Client not found']);
                exit;
            }
            
            // Parse pets JSON and transform data
            $client['pets'] = json_decode($client['pets'], true) ?? [];
            $client['appointment_count'] = (int)$client['appointment_count'];
            
            echo json_encode($client);
        } else {
            // Get all clients with pagination and search
            $whereClause = '';
            $params = [];
            
            if ($search) {
                $whereClause = 'WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.address LIKE ?';
                $searchParam = '%' . $search . '%';
                $params = [$searchParam, $searchParam, $searchParam, $searchParam];
            }
            
            // Get total count for pagination
            $countSql = "SELECT COUNT(DISTINCT c.id) as total FROM clients c $whereClause";
            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get clients with appointment counts
            $sql = "
                SELECT c.*, 
                       COUNT(a.id) as appointment_count,
                       MAX(a.date) as last_appointment_date,
                       MIN(a.date) as first_appointment_date
                FROM clients c 
                LEFT JOIN appointments a ON c.id = a.clientId 
                $whereClause
                GROUP BY c.id, c.name, c.email, c.phone, c.address, c.pets, c.notes, c.createdAt, c.updatedAt
                ORDER BY c.name ASC 
                LIMIT $limit OFFSET $offset
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transform data for frontend
            $transformedClients = array_map(function($client) {
                // Parse pets JSON
                $client['pets'] = json_decode($client['pets'], true) ?? [];
                $client['appointment_count'] = (int)$client['appointment_count'];
                
                // Format dates
                if ($client['last_appointment_date']) {
                    $client['last_appointment_date'] = date('Y-m-d', strtotime($client['last_appointment_date']));
                }
                if ($client['first_appointment_date']) {
                    $client['first_appointment_date'] = date('Y-m-d', strtotime($client['first_appointment_date']));
                }
                
                return $client;
            }, $clients);
            
            echo json_encode([
                'clients' => $transformedClients,
                'total' => (int)$totalCount,
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
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['phone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: name, email, phone']);
        exit;
    }
    
    try {
        // Check if client already exists (like in appointments.php)
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE email = ? OR phone = ?');
        $stmt->execute([$input['email'], $input['phone']]);
        $existingClient = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingClient) {
            http_response_code(409);
            echo json_encode(['error' => 'Client with this email or phone already exists', 'existingId' => $existingClient['id']]);
            exit;
        }
        
        // Prepare pets data (similar to how appointments handles services)
        $pets = $input['pets'] ?? [];
        $petsJson = json_encode($pets);
        
        // Insert new client (following appointments.php pattern)
        $stmt = $pdo->prepare('
            INSERT INTO clients (name, email, phone, address, pets, notes, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['address'] ?? '',
            $petsJson,
            $input['notes'] ?? ''
        ]);
        
        $clientId = $pdo->lastInsertId();
        
        // Return the created client with appointment count
        $stmt = $pdo->prepare('
            SELECT c.*, 
                   COUNT(a.id) as appointment_count
            FROM clients c 
            LEFT JOIN appointments a ON c.id = a.clientId 
            WHERE c.id = ?
            GROUP BY c.id
        ');
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        $client['pets'] = json_decode($client['pets'], true) ?? [];
        $client['appointment_count'] = (int)$client['appointment_count'];
        
        echo json_encode(['message' => 'Client created successfully', 'client' => $client]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create client: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'PUT') {
    // Update existing client
    $clientId = $_GET['id'] ?? null;
    
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
        
        // Check for duplicate email/phone if being changed
        if (isset($input['email']) || isset($input['phone'])) {
            $checkSql = 'SELECT id FROM clients WHERE (email = ? OR phone = ?) AND id != ?';
            $stmt = $pdo->prepare($checkSql);
            $stmt->execute([
                $input['email'] ?? '', 
                $input['phone'] ?? '', 
                $clientId
            ]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Client with this email or phone already exists']);
                exit;
            }
        }
        
        // Build update query dynamically (like appointments.php does)
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
        
        if (count($fields) > 1) { // More than just updatedAt
            $sql = 'UPDATE clients SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
        }
        
        // Return updated client with appointment count
        $stmt = $pdo->prepare('
            SELECT c.*, 
                   COUNT(a.id) as appointment_count,
                   MAX(a.date) as last_appointment_date
            FROM clients c 
            LEFT JOIN appointments a ON c.id = a.clientId 
            WHERE c.id = ?
            GROUP BY c.id
        ');
        $stmt->execute([$clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        $client['pets'] = json_decode($client['pets'], true) ?? [];
        $client['appointment_count'] = (int)$client['appointment_count'];
        
        echo json_encode(['message' => 'Client updated successfully', 'client' => $client]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update client: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'DELETE') {
    // Delete client
    $clientId = $_GET['id'] ?? null;
    
    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Client ID required']);
        exit;
    }
    
    try {
        // Check if client has appointments (prevent deletion if they do)
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM appointments WHERE clientId = ?');
        $stmt->execute([$clientId]);
        $appointmentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($appointmentCount > 0) {
            http_response_code(409);
            echo json_encode([
                'error' => 'Cannot delete client with existing appointments', 
                'appointmentCount' => $appointmentCount
            ]);
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
