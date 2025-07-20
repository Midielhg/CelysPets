<?php
// Direct Register Endpoint - Bypass .htaccess
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
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

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password']) || !isset($input['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email, password, and name are required']);
    exit();
}

$email = $input['email'];
$password = $input['password'];
$name = $input['name'];

// Check if user already exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'User already exists']);
    exit();
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Create user
$stmt = $pdo->prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
$stmt->execute([$email, $hashedPassword, $name]);

$userId = $pdo->lastInsertId();

// Generate simple token
$token = base64_encode(json_encode([
    'user_id' => $userId,
    'email' => $email,
    'exp' => time() + (24 * 60 * 60) // 24 hours
]));

// Return success
echo json_encode([
    'message' => 'Registration successful',
    'token' => $token,
    'user' => [
        'id' => $userId,
        'email' => $email,
        'name' => $name
    ]
]);
?>
