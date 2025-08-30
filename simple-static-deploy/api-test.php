<?php
// Simple API test
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Test response
echo json_encode([
    'status' => 'working',
    'message' => 'CelysPets API is operational',
    'timestamp' => date('c'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'endpoint' => $_SERVER['REQUEST_URI'] ?? 'unknown'
]);
?>
