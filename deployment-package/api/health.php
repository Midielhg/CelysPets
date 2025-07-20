<?php
// Direct Health Check Endpoint - Bypass .htaccess
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'OK',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'message' => 'Direct API access working'
]);
?>
