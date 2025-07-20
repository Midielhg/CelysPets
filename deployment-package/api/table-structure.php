<?php
// Check table structure
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$database = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'hY9cq6KT3$';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get table structure
    $stmt = $pdo->query("DESCRIBE appointments");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data
    $stmt = $pdo->query("SELECT * FROM appointments LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'table_structure' => $columns,
        'sample_data' => $sample,
        'column_names' => array_column($columns, 'Field')
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
