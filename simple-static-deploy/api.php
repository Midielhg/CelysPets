<?php
// CelysPets API - Fixed for Production
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
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Database initialization function
function initializeDatabase($pdo) {
    try {
        // Create users table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role ENUM('client', 'admin', 'groomer') DEFAULT 'client',
            businessSettings JSON NULL,
            googleTokens JSON NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_role (role)
        )");

        // Create clients table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address TEXT NOT NULL,
            pets JSON NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_name (name)
        )");

        // Create appointments table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            clientId INT NOT NULL,
            groomerId INT NULL,
            services JSON NOT NULL,
            date DATE NOT NULL,
            time VARCHAR(10) NOT NULL,
            status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
            notes TEXT NULL,
            totalAmount DECIMAL(10, 2) NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (groomerId) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_client (clientId),
            INDEX idx_groomer (groomerId),
            INDEX idx_date (date),
            INDEX idx_status (status)
        )");

        // Create pets table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS pets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ownerId INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            species ENUM('dog', 'cat') NOT NULL,
            breed VARCHAR(255) NOT NULL,
            age INT NOT NULL,
            weight INT NOT NULL,
            notes TEXT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_owner (ownerId),
            INDEX idx_species (species)
        )");

        // Create breeds table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS breeds (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            species ENUM('dog', 'cat') NOT NULL,
            sizeCategory ENUM('small', 'medium', 'large', 'xlarge', 'xxlarge') NOT NULL,
            fullGroomPrice DECIMAL(10, 2) NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_species (species),
            INDEX idx_name (name),
            INDEX idx_size (sizeCategory)
        )");

        // Create additional_services table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS additional_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL DEFAULT 0,
            description TEXT NULL,
            active BOOLEAN DEFAULT TRUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_active (active)
        )");

        // Check if admin user exists, if not create one
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $stmt->execute();
        $adminCount = $stmt->fetchColumn();

        if ($adminCount == 0) {
            // Create default admin user
            $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
            $stmt->execute(['admin@celyspets.com', $adminPassword, 'Admin User', 'admin']);
        }

    } catch (PDOException $e) {
        // Silently handle table creation errors (they might already exist)
        error_log("Database initialization warning: " . $e->getMessage());
    }
}

// Helper function to validate token
function validateToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader)) {
        return null; // No auth required for now
    }
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $decoded = base64_decode($token);
        $tokenData = json_decode($decoded, true);
        
        if ($tokenData && isset($tokenData['user_id']) && isset($tokenData['exp'])) {
            if ($tokenData['exp'] > time()) {
                return $tokenData;
            }
        }
    }
    
    return null; // Invalid token, but allow access for now
}

// Helper function to format time with AM/PM
function formatTime($time) {
    if (empty($time)) {
        return '12:00 PM';
    }
    
    // If already has AM/PM, return as is
    if (preg_match('/\s(AM|PM)$/i', $time)) {
        return $time;
    }
    
    // Parse time and add AM/PM
    $parts = explode(':', $time);
    $hours = intval($parts[0]);
    $minutes = isset($parts[1]) ? intval($parts[1]) : 0;
    
    $period = $hours >= 12 ? 'PM' : 'AM';
    $displayHours = $hours == 0 ? 12 : ($hours > 12 ? $hours - 12 : $hours);
    
    return sprintf('%d:%02d %s', $displayHours, $minutes, $period);
}

// Get request info
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove /api.php and /api/ prefix and clean path
$path = preg_replace('#^.*?/api\.php#', '', $path);
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

// Get JSON input for POST requests
$input = null;
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// Validate token for protected endpoints
$user = validateToken();

// Simple routing
switch ($path) {
    case '':
    case 'health':
        try {
            // Test database connection by checking if admin user exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'admin@celyspets.com'");
            $stmt->execute();
            $adminCount = $stmt->fetchColumn();
            
            echo json_encode([
                'status' => 'OK', 
                'timestamp' => date('c'),
                'database' => 'Connected',
                'environment' => 'production',
                'admin_user_found' => $adminCount > 0
            ]);
        } catch (PDOException $e) {
            echo json_encode([
                'status' => 'OK', 
                'timestamp' => date('c'),
                'database' => 'Error: ' . $e->getMessage(),
                'environment' => 'production'
            ]);
        }
        break;
        
    case 'test':
        echo json_encode([
            'message' => 'API is working!',
            'method' => $method,
            'path' => $path,
            'database' => 'Connected'
        ]);
        break;
        
    case 'setup/reset-admin-password':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        try {
            // Hash the password using PHP's password_hash
            $newPasswordHash = password_hash('admin123', PASSWORD_DEFAULT);
            
            // Update the admin user's password
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@celyspets.com'");
            $result = $stmt->execute([$newPasswordHash]);
            
            if ($result) {
                // Verify it worked
                $stmt = $pdo->prepare("SELECT password FROM users WHERE email = 'admin@celyspets.com'");
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $verifyResult = password_verify('admin123', $user['password']);
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Admin password reset successfully',
                    'verification_test' => $verifyResult ? 'valid' : 'invalid',
                    'new_credentials' => [
                        'email' => 'admin@celyspets.com',
                        'password' => 'admin123'
                    ]
                ]);
            } else {
                echo json_encode(['error' => 'Failed to update password']);
            }
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Password reset failed: ' . $e->getMessage()]);
        }
        break;
        
    case 'test/admin':
        try {
            $stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE email = 'admin@celyspets.com'");
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo json_encode([
                    'status' => 'found',
                    'user' => $user,
                    'password_check' => password_verify('admin123', $user['password'] ?? '') ? 'valid' : 'invalid'
                ]);
            } else {
                echo json_encode(['status' => 'not_found']);
            }
        } catch (PDOException $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'setup/database':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        handleDatabaseSetup($pdo);
        break;
        
    case 'auth/login':
        handleLogin($pdo, $input);
        break;
        
    case 'auth/register':
        handleRegister($pdo, $input);
        break;
        
    case 'appointments':
        handleAppointments($pdo, $method, $input);
        break;
        
    case 'appointments/recent':
        handleRecentAppointments($pdo);
        break;
        
    case 'users':
        handleUsers($pdo, $method, $input);
        break;
        
    case 'users/stats/overview':
        handleUserStats($pdo);
        break;
        
    case 'users/bulk-update-roles':
        handleUsersBulkUpdate($pdo, $method, $input);
        break;
        
    case 'dashboard/stats':
        handleDashboardStats($pdo);
        break;
        
    case 'route-optimization/optimize':
        handleRouteOptimization($pdo, $method, $input);
        break;
        
    case 'clients':
        handleClients($pdo, $method, $input);
        break;
        
    case 'pricing/breeds':
        handlePricingBreeds($pdo, $method, $input);
        break;
        
    case 'pricing/additional-services':
        handlePricingAdditionalServices($pdo, $method, $input);
        break;
        
    case 'debug/tables':
        handleDebugTables($pdo);
        break;
        
    case 'debug/frontend':
        handleDebugFrontend($pdo);
        break;
        
    case 'setup/seed-data':
        handleSeedData($pdo);
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        break;
}

function handleDatabaseSetup($pdo) {
    try {
        // Re-run database initialization
        initializeDatabase($pdo);
        
        // Check tables exist
        $tables = ['users', 'clients', 'appointments', 'pets', 'breeds', 'additional_services'];
        $existingTables = [];
        
        foreach ($tables as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                $existingTables[] = $table;
            }
        }
        
        // Check admin user
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $stmt->execute();
        $adminCount = $stmt->fetchColumn();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Database setup completed',
            'tables_created' => $existingTables,
            'admin_users' => $adminCount,
            'default_admin' => [
                'email' => 'admin@celyspets.com',
                'password' => 'admin123'
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database setup failed: ' . $e->getMessage()]);
    }
}

function handleLogin($pdo, $input) {
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Email and password are required',
            'debug' => [
                'input_received' => $input,
                'has_email' => isset($input['email']),
                'has_password' => isset($input['password'])
            ]
        ]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($input['password'], $user['password'])) {
            // Create a simple token (in production, use JWT)
            $token = base64_encode(json_encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'client',
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ]));
            
            echo json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'] ?? $user['email'],
                    'role' => $user['role'] ?? 'client'
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'error' => 'Invalid email or password',
                'debug' => [
                    'email_received' => $input['email'],
                    'user_found' => $user ? true : false,
                    'user_email' => $user ? $user['email'] : null,
                    'user_role' => $user ? $user['role'] : null,
                    'password_verify_result' => $user ? password_verify($input['password'], $user['password']) : false
                ]
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
    }
}

function handleRegister($pdo, $input) {
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    try {
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'User already exists']);
            return;
        }
        
        // Create new user
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $input['email'],
            $hashedPassword,
            $input['name'] ?? $input['email'],
            $input['role'] ?? 'client'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'User registered successfully',
            'user_id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
}

function handleAppointments($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                // Check for date filter
                $dateFilter = isset($_GET['date']) ? $_GET['date'] : null;
                $whereClause = '';
                $params = [];
                
                if ($dateFilter) {
                    $whereClause = 'WHERE a.date = ?';
                    $params[] = $dateFilter;
                }
                
                // Join appointments with clients to get complete client data
                $sql = "
                    SELECT 
                        a.id,
                        a.clientId,
                        a.services,
                        a.date,
                        a.time,
                        a.status,
                        a.notes,
                        a.totalAmount,
                        a.createdAt,
                        a.updatedAt,
                        a.groomerId,
                        c.name as client_name,
                        c.email as client_email,
                        c.phone as client_phone,
                        c.address as client_address,
                        c.pets as client_pets,
                        c.notes as client_notes
                    FROM appointments a
                    LEFT JOIN clients c ON a.clientId = c.id
                    $whereClause
                    ORDER BY a.date DESC, a.time DESC 
                    LIMIT 50
                ";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format the data for the frontend
                $formattedAppointments = array_map(function($appointment) {
                    // Parse client pets JSON
                    $pets = [];
                    if ($appointment['client_pets']) {
                        $petsData = json_decode($appointment['client_pets'], true);
                        if (is_array($petsData)) {
                            $pets = array_map(function($pet) {
                                return [
                                    'name' => $pet['name'] ?? '',
                                    'breed' => $pet['breed'] ?? '',
                                    'age' => $pet['age'] ?? null,
                                    'type' => $pet['type'] ?? null,
                                    'size' => $pet['size'] ?? null
                                ];
                            }, $petsData);
                        }
                    }
                    
                    return [
                        'id' => $appointment['id'],
                        'client' => [
                            'id' => $appointment['clientId'],
                            'name' => $appointment['client_name'] ?? 'Unknown Client',
                            'email' => $appointment['client_email'] ?? '',
                            'phone' => $appointment['client_phone'] ?? '',
                            'address' => $appointment['client_address'] ?? '',
                            'pets' => $pets,
                            'notes' => $appointment['client_notes'] ?? ''
                        ],
                        'services' => json_decode($appointment['services'] ?? '[]', true),
                        'date' => date('Y-m-d', strtotime($appointment['date'])), // Format as YYYY-MM-DD
                        'time' => formatTime($appointment['time']), // Ensure proper AM/PM format
                        'status' => $appointment['status'],
                        'notes' => $appointment['notes'],
                        'totalAmount' => floatval($appointment['totalAmount'] ?? 0),
                        'createdAt' => $appointment['createdAt'],
                        'updatedAt' => $appointment['updatedAt'],
                        'groomerId' => $appointment['groomerId']
                    ];
                }, $appointments);
                
                echo json_encode($formattedAppointments);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch appointments: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("INSERT INTO appointments (clientId, services, date, time, status, notes, totalAmount) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['clientId'] ?? 1, // Default to client ID 1 for now
                    json_encode($input['services'] ?? []),
                    $input['date'] ?? '',
                    $input['time'] ?? '',
                    'pending',
                    $input['notes'] ?? '',
                    $input['totalAmount'] ?? 0
                ]);
                
                echo json_encode([
                    'success' => true,
                    'id' => $pdo->lastInsertId(),
                    'message' => 'Appointment created successfully'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create appointment: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handleRecentAppointments($pdo) {
    try {
        // Get recent appointments (last 10) ordered by updatedAt
        $sql = "
            SELECT 
                a.id,
                a.clientId,
                a.services,
                a.date,
                a.time,
                a.status,
                a.notes,
                a.totalAmount,
                a.createdAt,
                a.updatedAt,
                a.groomerId,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                c.address as client_address,
                c.pets as client_pets
            FROM appointments a
            LEFT JOIN clients c ON a.clientId = c.id
            ORDER BY a.updatedAt DESC 
            LIMIT 10
        ";
        
        $stmt = $pdo->query($sql);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the data for the frontend
        $formattedAppointments = array_map(function($appointment) {
            return [
                'id' => $appointment['id'],
                'client' => [
                    'id' => $appointment['clientId'],
                    'name' => $appointment['client_name'] ?? 'Unknown Client',
                    'email' => $appointment['client_email'] ?? '',
                    'phone' => $appointment['client_phone'] ?? '',
                    'address' => $appointment['client_address'] ?? ''
                ],
                'services' => json_decode($appointment['services'] ?? '[]', true),
                'date' => $appointment['date'],
                'time' => formatTime($appointment['time']),
                'status' => $appointment['status'],
                'notes' => $appointment['notes'],
                'totalAmount' => floatval($appointment['totalAmount'] ?? 0),
                'createdAt' => $appointment['createdAt'],
                'updatedAt' => $appointment['updatedAt'],
                'groomerId' => $appointment['groomerId']
            ];
        }, $appointments);
        
        echo json_encode($formattedAppointments);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch recent appointments: ' . $e->getMessage()]);
    }
}

function handleUsers($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                // Handle pagination parameters
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10;
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                $role = isset($_GET['role']) ? trim($_GET['role']) : 'all';
                $offset = ($page - 1) * $limit;
                
                // Build the WHERE clause for search and role filter
                $whereClause = '';
                $params = [];
                $conditions = [];
                
                if (!empty($search)) {
                    $conditions[] = "(name LIKE ? OR email LIKE ?)";
                    $searchParam = "%$search%";
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                }
                
                if ($role !== 'all') {
                    $conditions[] = "role = ?";
                    $params[] = $role;
                }
                
                if (!empty($conditions)) {
                    $whereClause = "WHERE " . implode(" AND ", $conditions);
                }
                
                // Get total count
                $countSql = "SELECT COUNT(*) as total FROM users $whereClause";
                $countStmt = $pdo->prepare($countSql);
                $countStmt->execute($params);
                $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Get users with pagination
                $sql = "SELECT id, email, name, role FROM users $whereClause ORDER BY id DESC LIMIT $limit OFFSET $offset";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Calculate pagination info
                $totalPages = ceil($totalCount / $limit);
                
                echo json_encode([
                    'users' => $users,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => intval($totalCount),
                        'totalPages' => $totalPages,
                        'hasMore' => $page < $totalPages
                    ]
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch users: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handleUserStats($pdo) {
    try {
        // Get user count by role
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        $roleCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total user count
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get recent users (last 5)
        $stmt = $pdo->query("SELECT id, email, name, role FROM users ORDER BY id DESC LIMIT 5");
        $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Initialize role counts
        $adminCount = 0;
        $clientCount = 0;
        $groomerCount = 0;
        
        // Format role counts
        foreach ($roleCounts as $roleCount) {
            if ($roleCount['role'] === 'admin') {
                $adminCount = intval($roleCount['count']);
            } elseif ($roleCount['role'] === 'client') {
                $clientCount = intval($roleCount['count']);
            } elseif ($roleCount['role'] === 'groomer') {
                $groomerCount = intval($roleCount['count']);
            }
        }
        
        echo json_encode([
            'totals' => [
                'users' => intval($totalUsers),
                'clients' => $clientCount,
                'groomers' => $groomerCount,
                'admins' => $adminCount
            ],
            'recentUsers' => $recentUsers
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user stats: ' . $e->getMessage()]);
    }
}

function handleUsersBulkUpdate($pdo, $method, $input) {
    if ($method !== 'PATCH') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        // Validate input
        if (!isset($input['userIds']) || !isset($input['role'])) {
            http_response_code(400);
            echo json_encode(['error' => 'userIds and role are required']);
            return;
        }
        
        $userIds = $input['userIds'];
        $role = $input['role'];
        
        // Validate role
        $validRoles = ['client', 'admin', 'groomer'];
        if (!in_array($role, $validRoles)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid role. Must be client, admin, or groomer']);
            return;
        }
        
        // Create placeholders for IN clause
        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
        
        // Update users
        $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id IN ($placeholders)");
        $params = array_merge([$role], $userIds);
        $stmt->execute($params);
        
        $updatedCount = $stmt->rowCount();
        
        echo json_encode([
            'message' => "Successfully updated $updatedCount user(s) to $role role",
            'updatedCount' => $updatedCount
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user roles: ' . $e->getMessage()]);
    }
}

function handleDashboardStats($pdo) {
    try {
        // Get current month start and end dates
        $currentMonth = date('Y-m-01');
        $nextMonth = date('Y-m-01', strtotime('+1 month'));
        
        // Get appointments count for this month
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM appointments WHERE date >= ? AND date < ? AND status != 'cancelled'");
        $stmt->execute([$currentMonth, $nextMonth]);
        $appointmentsThisMonth = intval($stmt->fetch(PDO::FETCH_ASSOC)['count']);
        
        // Get total revenue for this month
        $stmt = $pdo->prepare("SELECT SUM(totalAmount) as revenue FROM appointments WHERE date >= ? AND date < ? AND status IN ('completed', 'confirmed', 'in-progress')");
        $stmt->execute([$currentMonth, $nextMonth]);
        $revenue = $stmt->fetch(PDO::FETCH_ASSOC)['revenue'];
        $totalRevenue = $revenue ? floatval($revenue) : 0;
        
        // Get total clients count
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM clients");
        $totalClients = intval($stmt->fetch(PDO::FETCH_ASSOC)['count']);
        
        // For now, use a fixed average rating (can be improved with reviews system)
        $averageRating = 4.8;
        
        echo json_encode([
            'appointmentsThisMonth' => $appointmentsThisMonth,
            'totalRevenue' => round($totalRevenue, 2),
            'totalClients' => $totalClients,
            'averageRating' => $averageRating
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch dashboard stats: ' . $e->getMessage()]);
    }
}

function handleClients($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                // Handle pagination parameters
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                $offset = ($page - 1) * $limit;
                
                // Build the WHERE clause for search
                $whereClause = '';
                $params = [];
                if (!empty($search)) {
                    $whereClause = "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?";
                    $searchParam = "%$search%";
                    $params = [$searchParam, $searchParam, $searchParam];
                }
                
                // Get total count for pagination
                $countQuery = "SELECT COUNT(*) as total FROM clients $whereClause";
                $countStmt = $pdo->prepare($countQuery);
                $countStmt->execute($params);
                $totalClients = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Get clients with pagination
                $query = "SELECT * FROM clients $whereClause ORDER BY id DESC LIMIT $limit OFFSET $offset";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format the data for the frontend
                $formattedClients = array_map(function($client) {
                    // Parse pets JSON
                    $pets = [];
                    if ($client['pets']) {
                        $petsData = json_decode($client['pets'], true);
                        if (is_array($petsData)) {
                            $pets = array_map(function($pet) {
                                return [
                                    'name' => $pet['name'] ?? '',
                                    'breed' => $pet['breed'] ?? '',
                                    'age' => $pet['age'] ?? null,
                                    'type' => $pet['type'] ?? null,
                                    'size' => $pet['size'] ?? null
                                ];
                            }, $petsData);
                        }
                    }
                    
                    return [
                        'id' => $client['id'],
                        'name' => $client['name'],
                        'email' => $client['email'],
                        'phone' => $client['phone'],
                        'address' => $client['address'],
                        'pets' => $pets,
                        'notes' => $client['notes'],
                        'createdAt' => $client['createdAt'],
                        'updatedAt' => $client['updatedAt']
                    ];
                }, $clients);
                
                // Return paginated response
                echo json_encode([
                    'clients' => $formattedClients,
                    'pagination' => [
                        'currentPage' => $page,
                        'totalPages' => ceil($totalClients / $limit),
                        'totalClients' => intval($totalClients),
                        'hasNextPage' => $page < ceil($totalClients / $limit),
                        'hasPrevPage' => $page > 1
                    ]
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch clients: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handlePricingBreeds($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                $stmt = $pdo->query("SELECT * FROM breeds WHERE active = 1 ORDER BY species ASC, sizeCategory ASC, name ASC");
                $breeds = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format the response to match TypeScript interface
                $formattedBreeds = array_map(function($breed) {
                    return [
                        'id' => (int)$breed['id'],
                        'species' => $breed['species'],
                        'name' => $breed['name'],
                        'sizeCategory' => $breed['sizeCategory'],
                        'fullGroomPrice' => (float)$breed['fullGroomPrice'],
                        'active' => (bool)$breed['active']
                    ];
                }, $breeds);
                
                echo json_encode($formattedBreeds);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch breeds: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            try {
                // Validate required fields
                if (!isset($input['species']) || !isset($input['name']) || !isset($input['sizeCategory']) || !isset($input['fullGroomPrice'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields: species, name, sizeCategory, fullGroomPrice']);
                    return;
                }
                
                $stmt = $pdo->prepare("INSERT INTO breeds (species, name, sizeCategory, fullGroomPrice, active) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['species'],
                    $input['name'],
                    $input['sizeCategory'],
                    $input['fullGroomPrice'],
                    $input['active'] ?? true
                ]);
                
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM breeds WHERE id = ?");
                $stmt->execute([$id]);
                $breed = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'id' => (int)$breed['id'],
                    'species' => $breed['species'],
                    'name' => $breed['name'],
                    'sizeCategory' => $breed['sizeCategory'],
                    'fullGroomPrice' => (float)$breed['fullGroomPrice'],
                    'active' => (bool)$breed['active']
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create breed: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handlePricingAdditionalServices($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                $stmt = $pdo->query("SELECT * FROM additional_services WHERE active = 1 ORDER BY name ASC");
                $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format the response to match TypeScript interface
                $formattedServices = array_map(function($service) {
                    return [
                        'id' => (int)$service['id'],
                        'code' => $service['code'],
                        'name' => $service['name'],
                        'price' => (float)$service['price'],
                        'description' => $service['description'],
                        'active' => (bool)$service['active']
                    ];
                }, $services);
                
                echo json_encode($formattedServices);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to fetch additional services: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            try {
                // Validate required fields
                if (!isset($input['code']) || !isset($input['name']) || !isset($input['price'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields: code, name, price']);
                    return;
                }
                
                $stmt = $pdo->prepare("INSERT INTO additional_services (code, name, price, description, active) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['code'],
                    $input['name'],
                    $input['price'],
                    $input['description'] ?? null,
                    $input['active'] ?? true
                ]);
                
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM additional_services WHERE id = ?");
                $stmt->execute([$id]);
                $service = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'id' => (int)$service['id'],
                    'code' => $service['code'],
                    'name' => $service['name'],
                    'price' => (float)$service['price'],
                    'description' => $service['description'],
                    'active' => (bool)$service['active']
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create additional service: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

function handleDebugFrontend($pdo) {
    try {
        // Get one appointment with full client data
        $stmt = $pdo->query("
            SELECT 
                a.id,
                a.clientId,
                a.services,
                a.date,
                a.time,
                a.status,
                a.notes,
                a.totalAmount,
                a.createdAt,
                a.updatedAt,
                a.groomerId,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                c.address as client_address,
                c.pets as client_pets,
                c.notes as client_notes
            FROM appointments a
            LEFT JOIN clients c ON a.clientId = c.id
            ORDER BY a.date DESC 
            LIMIT 1
        ");
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$appointment) {
            echo json_encode(['error' => 'No appointments found']);
            return;
        }
        
        // Parse client pets JSON
        $pets = [];
        if ($appointment['client_pets']) {
            $petsData = json_decode($appointment['client_pets'], true);
            if (is_array($petsData)) {
                $pets = array_map(function($pet) {
                    return [
                        'name' => $pet['name'] ?? '',
                        'breed' => $pet['breed'] ?? '',
                        'age' => $pet['age'] ?? null,
                        'type' => $pet['type'] ?? null,
                        'size' => $pet['size'] ?? null
                    ];
                }, $petsData);
            }
        }
        
        $formatted = [
            'id' => $appointment['id'],
            'client' => [
                'id' => $appointment['clientId'],
                'name' => $appointment['client_name'] ?? 'Unknown Client',
                'email' => $appointment['client_email'] ?? '',
                'phone' => $appointment['client_phone'] ?? '',
                'address' => $appointment['client_address'] ?? '',
                'pets' => $pets,
                'notes' => $appointment['client_notes'] ?? ''
            ],
            'services' => json_decode($appointment['services'] ?? '[]', true),
            'date' => $appointment['date'],
            'time' => $appointment['time'],
            'status' => $appointment['status'],
            'notes' => $appointment['notes'],
            'totalAmount' => floatval($appointment['totalAmount'] ?? 0),
            'createdAt' => $appointment['createdAt'],
            'updatedAt' => $appointment['updatedAt'],
            'groomerId' => $appointment['groomerId']
        ];
        
        echo json_encode([
            'message' => 'Frontend debug data',
            'timestamp' => date('c'),
            'sample_appointment' => $formatted,
            'raw_appointment' => $appointment,
            'expected_structure' => [
                'id' => 'string',
                'client' => [
                    'name' => 'should show client name',
                    'phone' => 'should show phone',
                    'pets' => 'should show array of pets'
                ],
                'date' => 'should show date',
                'time' => 'should show time'
            ]
        ], JSON_PRETTY_PRINT);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Debug failed: ' . $e->getMessage()]);
    }
}

function handleDebugTables($pdo) {
    try {
        $tables = ['users', 'appointments', 'clients'];
        $debug = [];
        
        foreach ($tables as $table) {
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $debug[$table] = [
                'columns' => array_column($columns, 'Field'),
                'full_schema' => $columns
            ];
            
            // Get sample row count
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            $debug[$table]['row_count'] = $count['count'];
        }
        
        echo json_encode([
            'database' => $debug,
            'timestamp' => date('c')
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Debug failed: ' . $e->getMessage()]);
    }
}

function handleRouteOptimization($pdo, $method, $input) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        $startLocation = $input['startLocation'] ?? '';
        $appointments = $input['appointments'] ?? [];
        
        if (empty($appointments)) {
            echo json_encode([
                'error' => 'No appointments provided'
            ]);
            return;
        }
        
        // Get full appointment details from database
        $appointmentIds = array_map(function($apt) { return $apt['id']; }, $appointments);
        $placeholders = str_repeat('?,', count($appointmentIds) - 1) . '?';
        
        $sql = "
            SELECT 
                a.id,
                a.clientId,
                a.time,
                a.date,
                c.name as client_name,
                c.address as client_address,
                c.phone as client_phone
            FROM appointments a
            LEFT JOIN clients c ON a.clientId = c.id
            WHERE a.id IN ($placeholders)
            ORDER BY a.time ASC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($appointmentIds);
        $dbAppointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create route stops
        $stops = [];
        foreach ($dbAppointments as $appointment) {
            $stops[] = [
                'appointment' => [
                    '_id' => $appointment['id'],
                    'client' => [
                        'name' => $appointment['client_name'],
                        'address' => $appointment['client_address'],
                        'phone' => $appointment['client_phone']
                    ],
                    'time' => $appointment['time'],
                    'date' => $appointment['date']
                ],
                'address' => $appointment['client_address'],
                'coordinates' => null, // Will be geocoded on frontend
                'estimatedDuration' => 30, // Default 30 minutes per appointment
                'distanceFromPrevious' => 0,
                'travelTimeFromPrevious' => 0
            ];
        }
        
        // Simple time-based optimization (can be enhanced with actual distance calculations)
        $totalDistance = count($stops) * 5; // Estimate 5 miles per stop
        $totalDuration = (count($stops) * 30) + (count($stops) * 15); // 30min per appointment + 15min travel
        $estimatedFuelCost = $totalDistance * 0.15; // $0.15 per mile
        
        $optimizedRoute = [
            'stops' => $stops,
            'totalDistance' => $totalDistance,
            'totalDuration' => $totalDuration,
            'estimatedFuelCost' => $estimatedFuelCost,
            'optimizationMethod' => 'time-based'
        ];
        
        echo json_encode($optimizedRoute);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Route optimization failed: ' . $e->getMessage()]);
    }
}

function handleSeedData($pdo) {
    try {
        // Check if we already have data
        $stmt = $pdo->query("SELECT COUNT(*) FROM clients");
        $clientCount = $stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM appointments");
        $appointmentCount = $stmt->fetchColumn();
        
        if ($clientCount > 0 && $appointmentCount > 0) {
            echo json_encode([
                'message' => 'Data already exists',
                'clients' => $clientCount,
                'appointments' => $appointmentCount
            ]);
            return;
        }
        
        // Add sample clients
        $sampleClients = [
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah@example.com',
                'phone' => '(555) 123-4567',
                'address' => '123 Oak Street, Miami, FL 33101',
                'pets' => json_encode([
                    ['name' => 'Buddy', 'breed' => 'Golden Retriever', 'age' => 3, 'type' => 'dog', 'size' => 'large']
                ])
            ],
            [
                'name' => 'Mike Wilson',
                'email' => 'mike@example.com',
                'phone' => '(555) 234-5678',
                'address' => '456 Pine Avenue, Miami, FL 33102',
                'pets' => json_encode([
                    ['name' => 'Whiskers', 'breed' => 'Persian', 'age' => 2, 'type' => 'cat', 'size' => 'medium']
                ])
            ],
            [
                'name' => 'Emily Davis',
                'email' => 'emily@example.com',
                'phone' => '(555) 345-6789',
                'address' => '789 Maple Drive, Miami, FL 33103',
                'pets' => json_encode([
                    ['name' => 'Max', 'breed' => 'Poodle', 'age' => 5, 'type' => 'dog', 'size' => 'medium']
                ])
            ]
        ];
        
        $clientIds = [];
        foreach ($sampleClients as $client) {
            $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone, address, pets) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $client['name'],
                $client['email'],
                $client['phone'],
                $client['address'],
                $client['pets']
            ]);
            $clientIds[] = $pdo->lastInsertId();
        }
        
        // Add sample appointments
        $sampleAppointments = [
            [
                'clientId' => $clientIds[0],
                'services' => json_encode(['full-groom']),
                'date' => date('Y-m-d'),
                'time' => '10:00 AM',
                'status' => 'pending',
                'notes' => 'First grooming session',
                'totalAmount' => 75.00
            ],
            [
                'clientId' => $clientIds[1],
                'services' => json_encode(['bath-brush']),
                'date' => date('Y-m-d', strtotime('+1 day')),
                'time' => '2:00 PM',
                'status' => 'confirmed',
                'notes' => 'Regular maintenance',
                'totalAmount' => 45.00
            ],
            [
                'clientId' => $clientIds[2],
                'services' => json_encode(['nail-trim', 'teeth-cleaning']),
                'date' => date('Y-m-d', strtotime('-1 day')),
                'time' => '11:30 AM',
                'status' => 'completed',
                'notes' => 'Monthly routine',
                'totalAmount' => 35.00
            ],
            [
                'clientId' => $clientIds[0],
                'services' => json_encode(['full-groom', 'nail-trim']),
                'date' => date('Y-m-d', strtotime('+2 days')),
                'time' => '9:00 AM',
                'status' => 'pending',
                'notes' => 'Special occasion grooming',
                'totalAmount' => 90.00
            ]
        ];
        
        $appointmentIds = [];
        foreach ($sampleAppointments as $appointment) {
            $stmt = $pdo->prepare("INSERT INTO appointments (clientId, services, date, time, status, notes, totalAmount) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $appointment['clientId'],
                $appointment['services'],
                $appointment['date'],
                $appointment['time'],
                $appointment['status'],
                $appointment['notes'],
                $appointment['totalAmount']
            ]);
            $appointmentIds[] = $pdo->lastInsertId();
        }
        
        // Add sample breeds
        $sampleBreeds = [
            ['species' => 'dog', 'name' => 'Chihuahua', 'sizeCategory' => 'small', 'fullGroomPrice' => 75.00],
            ['species' => 'dog', 'name' => 'Beagle', 'sizeCategory' => 'medium', 'fullGroomPrice' => 100.00],
            ['species' => 'dog', 'name' => 'Golden Retriever', 'sizeCategory' => 'large', 'fullGroomPrice' => 125.00],
            ['species' => 'dog', 'name' => 'German Shepherd', 'sizeCategory' => 'xlarge', 'fullGroomPrice' => 150.00],
            ['species' => 'dog', 'name' => 'Great Dane', 'sizeCategory' => 'xxlarge', 'fullGroomPrice' => 175.00],
            ['species' => 'cat', 'name' => 'Domestic Shorthair', 'sizeCategory' => 'small', 'fullGroomPrice' => 85.00],
            ['species' => 'cat', 'name' => 'Persian', 'sizeCategory' => 'medium', 'fullGroomPrice' => 85.00],
            ['species' => 'cat', 'name' => 'Maine Coon', 'sizeCategory' => 'large', 'fullGroomPrice' => 85.00]
        ];
        
        foreach ($sampleBreeds as $breed) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO breeds (species, name, sizeCategory, fullGroomPrice, active) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $breed['species'],
                $breed['name'],
                $breed['sizeCategory'],
                $breed['fullGroomPrice'],
                true
            ]);
        }
        
        // Add sample additional services
        $sampleServices = [
            ['code' => 'de-shedding', 'name' => 'De-Shedding Treatment', 'price' => 50.00],
            ['code' => 'teeth-cleaning', 'name' => 'Teeth Cleaning', 'price' => 20.00],
            ['code' => 'flea-tick', 'name' => 'Flea & Tick Treatment', 'price' => 45.00],
            ['code' => 'nail-trim', 'name' => 'Nail Trimming', 'price' => 15.00],
            ['code' => 'ear-cleaning', 'name' => 'Ear Cleaning', 'price' => 10.00],
            ['code' => 'special-shampoo', 'name' => 'Special Shampoo', 'price' => 25.00]
        ];
        
        foreach ($sampleServices as $service) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO additional_services (code, name, price, active) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $service['code'],
                $service['name'],
                $service['price'],
                true
            ]);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Sample data created successfully',
            'clients_created' => count($clientIds),
            'appointments_created' => count($appointmentIds),
            'breeds_created' => count($sampleBreeds),
            'services_created' => count($sampleServices)
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to seed data: ' . $e->getMessage()]);
    }
}
?>
