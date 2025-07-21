<?php
// Direct Appointments Endpoint - Bypass .htaccess
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
        // Get appointments
        $date = $_GET['date'] ?? null;
        
        if ($date) {
            $stmt = $pdo->prepare('
                SELECT a.*, c.name as client_name, c.address as client_address, c.phone as client_phone, c.email as client_email, c.pets as client_pets
                FROM appointments a 
                LEFT JOIN clients c ON a.clientId = c.id 
                WHERE DATE(a.date) = ? 
                ORDER BY a.date, a.time
            ');
            $stmt->execute([$date]);
        } else {
            $stmt = $pdo->query('
                SELECT a.*, c.name as client_name, c.address as client_address, c.phone as client_phone, c.email as client_email, c.pets as client_pets
                FROM appointments a 
                LEFT JOIN clients c ON a.clientId = c.id 
                ORDER BY a.date, a.time
            ');
        }
        
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transform data to match frontend expectations
        $transformedAppointments = array_map(function($apt) {
            // Use the date and time from database
            $datetime = new DateTime($apt['date']);
            $date = $datetime->format('Y-m-d');
            $time = $apt['time']; // Use time directly from database
            
            // Parse services JSON
            $services = json_decode($apt['services'], true) ?? [];
            
            // Parse pets JSON from client data (it's stored as JSON in clients table)
            $pets = [];
            if (isset($apt['client_pets']) && $apt['client_pets']) {
                $pets = json_decode($apt['client_pets'], true) ?? [];
            }
            
            return [
                '_id' => (string)$apt['id'],
                'id' => $apt['id'],
                'client' => [
                    'id' => $apt['clientId'] ?? '',
                    'name' => $apt['client_name'] ?? 'Unknown Client',
                    'address' => $apt['client_address'] ?? '',
                    'phone' => $apt['client_phone'] ?? '',
                    'email' => $apt['client_email'] ?? '',
                    'pets' => $pets
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
        
        echo json_encode($transformedAppointments);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Query failed: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'POST') {
    // Create appointment
    $input = json_decode(file_get_contents('php://input'), true);
    
    // First, check if client exists or create one
    $clientId = null;
    if (isset($input['clientId']) && $input['clientId']) {
        $clientId = $input['clientId'];
    } else {
        // Create or find client
        $stmt = $pdo->prepare('SELECT id FROM clients WHERE email = ? OR phone = ?');
        $stmt->execute([$input['client_email'] ?? '', $input['client_phone'] ?? '']);
        $existingClient = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingClient) {
            $clientId = $existingClient['id'];
        } else {
            // Create new client
            $stmt = $pdo->prepare('
                INSERT INTO clients (name, email, phone, address) 
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $input['client_name'] ?? $input['client']['name'] ?? 'Unknown',
                $input['client_email'] ?? $input['client']['email'] ?? '',
                $input['client_phone'] ?? $input['client']['phone'] ?? '',
                $input['client_address'] ?? $input['client']['address'] ?? ''
            ]);
            $clientId = $pdo->lastInsertId();
        }
    }
    
    // Prepare services JSON
    $services = $input['services'] ?? [];
    if (is_string($services)) {
        $services = explode(',', $services);
    }
    $servicesJson = json_encode($services);
    
    $stmt = $pdo->prepare('
        INSERT INTO appointments (clientId, services, date, time, status, notes, totalAmount, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    
    $stmt->execute([
        $clientId,
        $servicesJson,
        $input['date'],
        $input['time'],
        $input['status'] ?? 'pending',
        $input['notes'] ?? '',
        $input['totalAmount'] ?? 0
    ]);
    
    $appointmentId = $pdo->lastInsertId();
    echo json_encode(['id' => $appointmentId, 'message' => 'Appointment created successfully']);
    
} elseif ($method === 'PUT') {
    // Update appointment
    $appointmentId = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$appointmentId) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID required']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Prepare services JSON
    $services = $input['services'] ?? [];
    if (is_string($services)) {
        $services = explode(',', $services);
    }
    $servicesJson = json_encode($services);
    
    $stmt = $pdo->prepare('
        UPDATE appointments 
        SET services=?, date=?, time=?, notes=?, status=?, totalAmount=?, updatedAt=NOW() 
        WHERE id=?
    ');
    
    $stmt->execute([
        $servicesJson,
        $input['date'],
        $input['time'],
        $input['notes'] ?? '',
        $input['status'] ?? 'pending',
        $input['totalAmount'] ?? 0,
        $appointmentId
    ]);
    
    echo json_encode(['message' => 'Appointment updated successfully']);
    
} elseif ($method === 'DELETE') {
    // Delete appointment
    $appointmentId = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$appointmentId) {
        http_response_code(400);
        echo json_encode(['error' => 'Appointment ID required']);
        exit();
    }
    
    $stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ?');
    $stmt->execute([$appointmentId]);
    
    echo json_encode(['message' => 'Appointment deleted successfully']);
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
