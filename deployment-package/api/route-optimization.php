<?php
// Route Optimization Endpoint - Bypass .htaccess
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

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['appointments']) || !is_array($input['appointments'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Appointments array required']);
    exit();
}

$appointments = $input['appointments'];
$startLocation = $input['startLocation'] ?? '';

// Simple route optimization algorithm
// In a real app, you'd use Google Maps API or similar service
function optimizeRoute($appointments) {
    if (empty($appointments)) {
        return [];
    }
    
    // For demo purposes, just sort by address alphabetically
    // In production, you'd calculate actual driving distances
    usort($appointments, function($a, $b) {
        $addressA = $a['address'] ?? $a['client_address'] ?? '';
        $addressB = $b['address'] ?? $b['client_address'] ?? '';
        return strcmp($addressA, $addressB);
    });
    
    // Add estimated times (demo data)
    $currentTime = new DateTime();
    foreach ($appointments as &$appointment) {
        $appointment['estimated_arrival'] = $currentTime->format('H:i');
        $appointment['estimated_duration'] = '60'; // 60 minutes
        $currentTime->add(new DateInterval('PT90M')); // Add 90 minutes (60 + 30 travel)
    }
    
    return $appointments;
}

$optimizedRoute = optimizeRoute($appointments);

// Calculate route statistics
$totalAppointments = count($optimizedRoute);
$totalEstimatedTime = $totalAppointments * 90; // 90 minutes per appointment (including travel)
$startTime = new DateTime();
$endTime = clone $startTime;
$endTime->add(new DateInterval("PT{$totalEstimatedTime}M"));

echo json_encode([
    'optimizedRoute' => $optimizedRoute,
    'routeStats' => [
        'totalAppointments' => $totalAppointments,
        'estimatedStartTime' => $startTime->format('H:i'),
        'estimatedEndTime' => $endTime->format('H:i'),
        'totalDuration' => $totalEstimatedTime . ' minutes',
        'averageTimePerStop' => '90 minutes'
    ],
    'message' => 'Route optimized successfully'
]);
?>
