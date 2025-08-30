<?php
// Quick Login Diagnostic and Fix
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'nCvCE42v6_';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() == 0) {
        // Create users table
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role ENUM('client', 'admin', 'groomer') DEFAULT 'client',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        )");
        
        echo json_encode(['message' => 'Users table created']);
        exit();
    }
    
    // Check for admin user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = 'admin@celyspets.com'");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        // Create admin user
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin@celyspets.com', $hashedPassword, 'Administrator', 'admin']);
        
        echo json_encode([
            'message' => 'Admin user created successfully',
            'email' => 'admin@celyspets.com',
            'password' => 'admin123',
            'role' => 'admin'
        ]);
        exit();
    }
    
    // Test login if POST request
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input && isset($input['email']) && isset($input['password'])) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$input['email']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($input['password'], $user['password'])) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role']
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid credentials',
                    'debug' => [
                        'user_found' => $user ? true : false,
                        'password_check' => $user ? password_verify($input['password'], $user['password']) : false
                    ]
                ]);
            }
        } else {
            echo json_encode(['error' => 'Email and password required']);
        }
    } else {
        // GET request - show admin user status
        echo json_encode([
            'message' => 'Admin user exists',
            'admin_email' => $admin['email'],
            'admin_role' => $admin['role'],
            'instruction' => 'POST to this endpoint with {"email":"admin@celyspets.com","password":"admin123"} to test login'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
