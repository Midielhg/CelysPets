<?php
// PHP Backend for Cely's Pets Mobile Grooming
// This replaces the Node.js backend for shared hosting compatibility

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
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

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string and decode URL
$path = parse_url($request_uri, PHP_URL_PATH);
$path = urldecode($path);

// Remove /dev prefix if present (for your hosting setup)
$path = preg_replace('#^/dev#', '', $path);

// Remove /api prefix if present
$path = preg_replace('#^/api#', '', $path);

// Handle direct calls to this file (when .htaccess doesn't work)
if (basename(__FILE__) === 'index.php' && !$path) {
    // If called directly as /api/index.php, check for route parameter
    if (isset($_GET['route'])) {
        $path = '/' . $_GET['route'];
    } else {
        // Default to health check if no route specified
        $path = '/health';
    }
}

// Simple test route for debugging
if (isset($_GET['test'])) {
    echo json_encode([
        'message' => 'PHP API is working!',
        'timestamp' => date('c'),
        'request_uri' => $_SERVER['REQUEST_URI'],
        'path' => $path,
        'method' => $_SERVER['REQUEST_METHOD'],
        'debug' => [
            'original_path' => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
            'processed_path' => $path,
            'get_params' => $_GET
        ]
    ]);
    exit();
}

// Route the request
switch ($path) {
    case '/health':
        handleHealth();
        break;
    
    case '/auth/login':
        if ($method === 'POST') {
            handleLogin($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    case '/auth/register':
        if ($method === 'POST') {
            handleRegister($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    case '/appointments':
        if ($method === 'GET') {
            handleGetAppointments($pdo);
        } elseif ($method === 'POST') {
            handleCreateAppointment($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    case (preg_match('#^/appointments/(\d+)$#', $path, $matches) ? true : false):
        $appointmentId = $matches[1];
        if ($method === 'PUT') {
            handleUpdateAppointment($pdo, $appointmentId);
        } elseif ($method === 'DELETE') {
            handleDeleteAppointment($pdo, $appointmentId);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    case '/clients':
        if ($method === 'GET') {
            handleGetClients($pdo);
        } elseif ($method === 'POST') {
            handleCreateClient($pdo);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        break;
    
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

// Health check endpoint
function handleHealth() {
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('c'),
        'version' => '1.0.0'
    ]);
}

// Login endpoint
function handleLogin($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare('SELECT id, email, password, name, role FROM users WHERE email = ?');
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($input['password'], $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }
        
        // Create a simple token (in production, use JWT)
        $token = base64_encode(json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]));
        
        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Register endpoint
function handleRegister($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || !isset($input['password']) || !isset($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email, password, and name required']);
        return;
    }
    
    try {
        // Check if user already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$input['email']]);
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'User already exists']);
            return;
        }
        
        // Create new user
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([$input['email'], $hashedPassword, $input['name'], 'client']);
        
        $userId = $pdo->lastInsertId();
        
        echo json_encode([
            'message' => 'User created successfully',
            'user' => [
                'id' => $userId,
                'email' => $input['email'],
                'name' => $input['name'],
                'role' => 'client'
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Get appointments
function handleGetAppointments($pdo) {
    try {
        $stmt = $pdo->query('
            SELECT a.*, c.name as clientName, c.email as clientEmail, c.phone as clientPhone 
            FROM appointments a 
            LEFT JOIN clients c ON a.clientId = c.id 
            ORDER BY a.date ASC
        ');
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        foreach ($appointments as &$appointment) {
            $appointment['services'] = json_decode($appointment['services'], true);
        }
        
        echo json_encode($appointments);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Create appointment
function handleCreateAppointment($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['clientId']) || !isset($input['services']) || !isset($input['date']) || !isset($input['time'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO appointments (clientId, services, date, time, status, notes, totalAmount, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $input['clientId'],
            json_encode($input['services']),
            $input['date'],
            $input['time'],
            $input['status'] ?? 'pending',
            $input['notes'] ?? null,
            $input['totalAmount'] ?? null
        ]);
        
        echo json_encode(['message' => 'Appointment created successfully', 'id' => $pdo->lastInsertId()]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Update appointment
function handleUpdateAppointment($pdo, $appointmentId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $fields = [];
        $values = [];
        
        if (isset($input['status'])) {
            $fields[] = 'status = ?';
            $values[] = $input['status'];
        }
        
        if (isset($input['notes'])) {
            $fields[] = 'notes = ?';
            $values[] = $input['notes'];
        }
        
        if (isset($input['date'])) {
            $fields[] = 'date = ?';
            $values[] = $input['date'];
        }
        
        if (isset($input['time'])) {
            $fields[] = 'time = ?';
            $values[] = $input['time'];
        }
        
        if (isset($input['services'])) {
            $fields[] = 'services = ?';
            $values[] = json_encode($input['services']);
        }
        
        if (isset($input['totalAmount'])) {
            $fields[] = 'totalAmount = ?';
            $values[] = $input['totalAmount'];
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        $fields[] = 'updatedAt = NOW()';
        $values[] = $appointmentId;
        
        $sql = 'UPDATE appointments SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Appointment updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Delete appointment
function handleDeleteAppointment($pdo, $appointmentId) {
    try {
        $stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ?');
        $stmt->execute([$appointmentId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Appointment deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Appointment not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Get clients
function handleGetClients($pdo) {
    try {
        $stmt = $pdo->query('SELECT * FROM clients ORDER BY name ASC');
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        foreach ($clients as &$client) {
            $client['pets'] = json_decode($client['pets'], true);
        }
        
        echo json_encode($clients);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Create client
function handleCreateClient($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['phone']) || !isset($input['address'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO clients (name, email, phone, address, pets, notes, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        
        $stmt->execute([
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['address'],
            json_encode($input['pets'] ?? []),
            $input['notes'] ?? null
        ]);
        
        echo json_encode(['message' => 'Client created successfully', 'id' => $pdo->lastInsertId()]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
