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
$host = 'mysql.us.cloudlogin.co';
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

// Remove /api/ prefix and clean path
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
    case 'health':
        echo json_encode([
            'status' => 'OK', 
            'timestamp' => date('c'),
            'database' => 'Connected',
            'environment' => 'production'
        ]);
        break;
        
    case 'test':
        echo json_encode([
            'message' => 'API is working!',
            'method' => $method,
            'path' => $path,
            'database' => 'Connected'
        ]);
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
        
    case 'clients':
        handleClients($pdo, $method, $input);
        break;
        
    case 'debug/tables':
        handleDebugTables($pdo);
        break;
        
    case 'debug/frontend':
        handleDebugFrontend($pdo);
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found: ' . $path]);
        break;
}

function handleLogin($pdo, $input) {
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
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
            echo json_encode(['error' => 'Invalid email or password']);
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
                // Join appointments with clients to get complete client data
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
                    ORDER BY a.date DESC, a.time DESC 
                    LIMIT 50
                ");
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

function handleUsers($pdo, $method, $input) {
    switch ($method) {
        case 'GET':
            try {
                // Simple query without timestamp columns first
                $stmt = $pdo->query("SELECT id, email, name, role FROM users ORDER BY id DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($users);
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
?>
