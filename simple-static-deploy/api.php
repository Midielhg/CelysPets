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
            sizeCategory ENUM('small', 'medium', 'large', 'extra-large') NOT NULL,
            bathOnlyPrice DECIMAL(10, 2) NOT NULL,
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

        // Create promo_codes table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS promo_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            discountType ENUM('percentage', 'fixed') NOT NULL,
            discountValue DECIMAL(10, 2) NOT NULL,
            minimumAmount DECIMAL(10, 2) NULL,
            maxUsageTotal INT NOT NULL DEFAULT 999999,
            maxUsagePerCustomer INT NOT NULL DEFAULT 1,
            currentUsageTotal INT NOT NULL DEFAULT 0,
            validFrom DATETIME NULL,
            validUntil DATETIME NULL,
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

        // Add some default breeds if none exist
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM breeds");
        $stmt->execute();
        $breedCount = $stmt->fetchColumn();
        
        if ($breedCount == 0) {
            $defaultBreeds = [
                ['dog', 'Golden Retriever', 'large', 125],
                ['dog', 'Labrador Retriever', 'large', 125],
                ['dog', 'Chihuahua', 'small', 75],
                ['dog', 'German Shepherd', 'xlarge', 150],
                ['dog', 'Bulldog', 'medium', 100],
                ['cat', 'Persian', 'all', 85],
                ['cat', 'Siamese', 'all', 85],
                ['cat', 'Maine Coon', 'all', 85]
            ];
            
            $stmt = $pdo->prepare("INSERT INTO breeds (species, name, sizeCategory, fullGroomPrice, active) VALUES (?, ?, ?, ?, 1)");
            foreach ($defaultBreeds as $breed) {
                $stmt->execute($breed);
            }
        }
        
        // Add some default additional services if none exist
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM additional_services");
        $stmt->execute();
        $serviceCount = $stmt->fetchColumn();
        
        if ($serviceCount == 0) {
            $defaultServices = [
                ['de-shedding', 'De-Shedding Treatment', 50, 'Reduces shedding for up to 6 weeks'],
                ['teeth-cleaning', 'Teeth Cleaning', 20, 'Basic dental hygiene service'],
                ['nail-trim', 'Nail Trim Only', 15, 'Quick nail trimming service'],
                ['ear-cleaning', 'Ear Cleaning', 10, 'Professional ear cleaning'],
                ['flea-tick', 'Flea & Tick Treatment', 45, 'Treatment for existing fleas and ticks'],
                ['special-shampoo', 'Special Shampoos', 25, 'Hypoallergenic/Whitening/Medicated shampoos']
            ];
            
            $stmt = $pdo->prepare("INSERT INTO additional_services (code, name, price, description, active) VALUES (?, ?, ?, ?, 1)");
            foreach ($defaultServices as $service) {
                $stmt->execute($service);
            }
        }
        
        // Add some default promo codes if none exist
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM promo_codes");
        $stmt->execute();
        $promoCount = $stmt->fetchColumn();
        
        if ($promoCount == 0) {
            $defaultPromoCodes = [
                ['WELCOME20', 'Welcome 20% Off', 'percentage', 20.00, 50.00, 100, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59'],
                ['SAVE15', 'Save $15 on Any Service', 'fixed', 15.00, 75.00, 50, 2, '2025-01-01 00:00:00', '2025-06-30 23:59:59'],
                ['FIRSTTIME', 'First Time Customer 25% Off', 'percentage', 25.00, 40.00, 1000, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59']
            ];
            
            $stmt = $pdo->prepare("INSERT INTO promo_codes (code, name, discountType, discountValue, minimumAmount, maxUsageTotal, maxUsagePerCustomer, validFrom, validUntil, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
            foreach ($defaultPromoCodes as $promo) {
                $stmt->execute($promo);
            }
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
        
    case 'users':
        handleUsers($pdo, $method, $input);
        break;
        
    case 'users/stats/overview':
        handleUserStats($pdo);
        break;
        
    case 'clients':
        handleClients($pdo, $method, $input);
        break;
        
    case 'debug/tables':
        handleDebugTables($pdo);
        break;
        
    case 'debug/frontend':
        handleDebugFrontend($pdo);
        break;
        
    case 'pricing/breeds':
        handlePricingBreeds($pdo, $method);
        break;
        
    case 'pricing/additional-services':
        handlePricingAdditionalServices($pdo, $method);
        break;
        
    case 'promo-codes/validate':
        handlePromoCodeValidation($pdo, $method, $input);
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
                // Handle new booking format with client information
                $clientId = null;
                
                if (isset($input['client'])) {
                    $client = $input['client'];
                    
                    // Check if client already exists by email
                    $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = ?");
                    $stmt->execute([$client['email']]);
                    $existingClient = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($existingClient) {
                        $clientId = $existingClient['id'];
                        // Update existing client information
                        $stmt = $pdo->prepare("UPDATE clients SET name = ?, phone = ?, address = ?, pets = ? WHERE id = ?");
                        $stmt->execute([
                            $client['name'],
                            $client['phone'],
                            $client['address'],
                            json_encode($client['pets'] ?? []),
                            $clientId
                        ]);
                    } else {
                        // Create new client
                        $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone, address, pets) VALUES (?, ?, ?, ?, ?)");
                        $stmt->execute([
                            $client['name'],
                            $client['email'],
                            $client['phone'],
                            $client['address'],
                            json_encode($client['pets'] ?? [])
                        ]);
                        $clientId = $pdo->lastInsertId();
                    }
                }
                
                // Create appointment with proper field mapping
                $stmt = $pdo->prepare("INSERT INTO appointments (clientId, services, date, time, status, notes, totalAmount) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $clientId ?? 1,
                    json_encode($input['services'] ?? []),
                    $input['date'] ?? '',
                    $input['time'] ?? '',
                    'pending',
                    $input['notes'] ?? '',
                    $input['totalAmount'] ?? 0
                ]);
                
                $appointmentId = $pdo->lastInsertId();
                
                echo json_encode([
                    'success' => true,
                    'id' => $appointmentId,
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
        
        // Format role counts
        $adminCount = 0;
        $clientCount = 0;
        foreach ($roleCounts as $roleCount) {
            if ($roleCount['role'] === 'admin') {
                $adminCount = intval($roleCount['count']);
            } elseif ($roleCount['role'] === 'client') {
                $clientCount = intval($roleCount['count']);
            }
        }
        
        echo json_encode([
            'overview' => [
                'admins' => $adminCount,
                'clients' => $clientCount,
                'users' => intval($totalUsers)
            ],
            'recentUsers' => $recentUsers,
            'totalUsers' => intval($totalUsers)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user stats: ' . $e->getMessage()]);
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

function handlePricingBreeds($pdo, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM breeds WHERE active = 1 ORDER BY species ASC, name ASC");
        $stmt->execute();
        $breeds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert numeric fields
        foreach ($breeds as &$breed) {
            $breed['id'] = (int)$breed['id'];
            $breed['fullGroomPrice'] = (float)$breed['fullGroomPrice'];
            $breed['fullGroomDuration'] = (int)($breed['fullGroomDuration'] ?? 90);
            $breed['active'] = (bool)$breed['active'];
        }
        
        echo json_encode($breeds);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch breeds: ' . $e->getMessage()]);
    }
}

function handlePricingAdditionalServices($pdo, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM additional_services WHERE active = 1 ORDER BY name ASC");
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert numeric fields
        foreach ($services as &$service) {
            $service['id'] = (int)$service['id'];
            $service['price'] = (float)$service['price'];
            $service['duration'] = (int)($service['duration'] ?? 30);
            $service['active'] = (bool)$service['active'];
        }
        
        echo json_encode($services);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch additional services: ' . $e->getMessage()]);
    }
}

function handlePromoCodeValidation($pdo, $method, $input) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    if (!$input || !isset($input['code']) || !isset($input['totalAmount'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Promo code and total amount are required']);
        return;
    }
    
    try {
        $code = strtoupper(trim($input['code']));
        $totalAmount = floatval($input['totalAmount']);
        $customerEmail = $input['customerEmail'] ?? 'guest@example.com';
        
        // Find the promo code
        $stmt = $pdo->prepare("SELECT * FROM promo_codes WHERE code = ? AND active = 1");
        $stmt->execute([$code]);
        $promoCode = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$promoCode) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid promo code']);
            return;
        }
        
        // Check date validity
        $now = new DateTime();
        if ($promoCode['validFrom'] && new DateTime($promoCode['validFrom']) > $now) {
            http_response_code(400);
            echo json_encode(['error' => 'Promo code is not yet valid']);
            return;
        }
        
        if ($promoCode['validUntil'] && new DateTime($promoCode['validUntil']) < $now) {
            http_response_code(400);
            echo json_encode(['error' => 'Promo code has expired']);
            return;
        }
        
        // Check minimum amount
        if ($promoCode['minimumAmount'] && $totalAmount < floatval($promoCode['minimumAmount'])) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Minimum order amount of $' . number_format($promoCode['minimumAmount'], 2) . ' required'
            ]);
            return;
        }
        
        // Check total usage limit
        if ($promoCode['currentUsageTotal'] >= $promoCode['maxUsageTotal']) {
            http_response_code(400);
            echo json_encode(['error' => 'Promo code usage limit reached']);
            return;
        }
        
        // Calculate discount
        $discountAmount = 0;
        if ($promoCode['discountType'] === 'percentage') {
            $discountAmount = ($totalAmount * floatval($promoCode['discountValue'])) / 100;
        } else {
            $discountAmount = min(floatval($promoCode['discountValue']), $totalAmount);
        }
        
        echo json_encode([
            'valid' => true,
            'promoCode' => [
                'id' => (int)$promoCode['id'],
                'code' => $promoCode['code'],
                'name' => $promoCode['name'],
                'discountType' => $promoCode['discountType'],
                'discountValue' => floatval($promoCode['discountValue'])
            ],
            'discountAmount' => $discountAmount,
            'message' => 'Promo code applied successfully!'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to validate promo code: ' . $e->getMessage()]);
    }
}
?>
