<?php
// Debug Appointments Endpoint - Enhanced logging
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Log all requests for debugging
error_log("Appointments API called - Method: " . $_SERVER['REQUEST_METHOD'] . " - URL: " . $_SERVER['REQUEST_URI']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$database = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'hY9cq6KT3$';

// Add debug info to response
$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'get_params' => $_GET,
    'headers' => getallheaders(),
    'timestamp' => date('c')
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $debug['database'] = 'connected';
} catch (PDOException $e) {
    $debug['database'] = 'failed: ' . $e->getMessage();
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage(), 'debug' => $debug]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Get appointments
        $date = $_GET['date'] ?? null;
        $debug['date_filter'] = $date;
        
        if ($date) {
            $stmt = $pdo->prepare('
                SELECT a.*, c.name as client_name, c.address as client_address, c.phone as client_phone, c.email as client_email 
                FROM appointments a 
                LEFT JOIN clients c ON a.clientId = c.id 
                WHERE DATE(a.date) = ? 
                ORDER BY a.date, a.time
            ');
            $stmt->execute([$date]);
        } else {
            $stmt = $pdo->query('
                SELECT a.*, c.name as client_name, c.address as client_address, c.phone as client_phone, c.email as client_email 
                FROM appointments a 
                LEFT JOIN clients c ON a.clientId = c.id 
                ORDER BY a.date, a.time
            ');
        }
        
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $debug['raw_count'] = count($appointments);
        
        // Transform data to match frontend expectations
        $transformedAppointments = array_map(function($apt) {
            // Use the date and time from database
            $datetime = new DateTime($apt['date']);
            $date = $datetime->format('Y-m-d');
            $time = $apt['time']; // Use time directly from database
            
            // Parse services JSON
            $services = json_decode($apt['services'], true) ?? [];
            
            return [
                '_id' => (string)$apt['id'],
                'id' => $apt['id'],
                'client' => [
                    'name' => $apt['client_name'] ?? 'Unknown Client',
                    'address' => $apt['client_address'] ?? '',
                    'phone' => $apt['client_phone'] ?? '',
                    'email' => $apt['client_email'] ?? ''
                ],
                'client_name' => $apt['client_name'] ?? 'Unknown Client',
                'client_email' => $apt['client_email'] ?? '',
                'client_phone' => $apt['client_phone'] ?? '',
                'client_address' => $apt['client_address'] ?? '',
                'date' => $date,
                'time' => $time,
                'appointment_date' => $apt['date'] . ' ' . $apt['time'], // Combine for compatibility
                'services' => $services,
                'service_type' => implode(',', $services), // For compatibility
                'status' => $apt['status'],
                'notes' => $apt['notes'] ?? '',
                'totalAmount' => $apt['totalAmount'] ?? 0,
                'clientId' => $apt['clientId']
            ];
        }, $appointments);
        
        $debug['transformed_count'] = count($transformedAppointments);
        
        // If no appointments found, add debug info
        if (empty($transformedAppointments)) {
            echo json_encode([
                'appointments' => [],
                'message' => 'No appointments found',
                'debug' => $debug
            ]);
        } else {
            echo json_encode([
                'appointments' => $transformedAppointments,
                'message' => 'Success',
                'debug' => $debug
            ]);
        }
        
    } catch (Exception $e) {
        $debug['error'] = $e->getMessage();
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $e->getMessage(), 'debug' => $debug]);
    }
    
} else {
    // For other methods, return the same structure as the original
    echo json_encode(['error' => 'Method not implemented in debug version', 'debug' => $debug]);
}
?>
