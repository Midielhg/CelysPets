<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://celyspets.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'celys_pets_CelysPets';
$username = 'celyspets_celypets';
$password = 'nCvCE42v6_';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get the request path and method
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Parse the request
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api.php', '', $path);

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Route handling
if ($method === 'POST' && $path === '/auth/login') {
    // Login endpoint
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['message' => 'Email and password are required']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
            exit();
        }
        
        // Create a simple token (in production, use proper JWT)
        $token = base64_encode(json_encode([
            'userId' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + (7 * 24 * 60 * 60) // 7 days
        ]));
        
        echo json_encode([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Login failed']);
    }
    
} elseif ($method === 'POST' && $path === '/auth/register') {
    // Register endpoint
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $name = $input['name'] ?? '';
    
    if (empty($email) || empty($password) || empty($name)) {
        http_response_code(400);
        echo json_encode(['message' => 'All fields are required']);
        exit();
    }
    
    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['message' => 'User already exists']);
            exit();
        }
        
        // Create user
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'client')");
        $stmt->execute([$email, $hashedPassword, $name]);
        
        $userId = $pdo->lastInsertId();
        
        // Create token
        $token = base64_encode(json_encode([
            'userId' => $userId,
            'email' => $email,
            'exp' => time() + (7 * 24 * 60 * 60)
        ]));
        
        echo json_encode([
            'message' => 'User created successfully',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'name' => $name,
                'role' => 'client'
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Registration failed']);
    }
    
} elseif ($method === 'GET' && $path === '/auth/me') {
    // Get current user endpoint
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['message' => 'No token provided']);
        exit();
    }
    
    $token = substr($authHeader, 7);
    $decoded = json_decode(base64_decode($token), true);
    
    if (!$decoded || $decoded['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid or expired token']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$decoded['userId']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['message' => 'User not found']);
            exit();
        }
        
        echo json_encode([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to get user']);
    }
    
} else {
    // Route not found
    http_response_code(404);
    echo json_encode(['message' => 'Endpoint not found']);
}
?>
