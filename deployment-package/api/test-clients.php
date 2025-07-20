<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database configuration
$host = 'localhost';
$database = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'hY9cq6KT3$';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test if clients table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'clients'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo json_encode(['status' => 'success', 'message' => 'clients table exists']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'clients table does not exist']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
