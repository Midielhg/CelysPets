<?php
// Direct Login Endpoint - Bypass .htaccess
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

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit();
}

$email = $input['email'];
$inputPassword = $input['password'];

// Find user
$stmt = $pdo->prepare('SELECT id, email, password, name, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid email or password']);
    exit();
}

// Verify password (handling both bcrypt and plain text for demo)
$passwordValid = false;
if (password_verify($inputPassword, $user['password'])) {
    $passwordValid = true;
} elseif ($user['password'] === $inputPassword) {
    // Fallback for plain text passwords (demo data)
    $passwordValid = true;
}

if (!$passwordValid) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid email or password']);
    exit();
}

// Generate simple token (for PHP hosting without JWT library)
$token = base64_encode(json_encode([
    'user_id' => $user['id'],
    'email' => $user['email'],
    'exp' => time() + (24 * 60 * 60) // 24 hours
]));

// Return success
echo json_encode([
    'message' => 'Login successful',
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'] ?? '',
        'role' => $user['role'] ?? 'admin'
    ]
]);
?>
