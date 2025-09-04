<?php
// Test script for API functionality
$host = 'localhost';
$dbname = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'nCvCE42v6_';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Database connection successful!\n";
    
    // Test promo codes table
    $stmt = $pdo->query("SHOW TABLES LIKE 'promo_codes'");
    if ($stmt->rowCount() > 0) {
        echo "Promo codes table exists\n";
        
        // Check promo codes
        $stmt = $pdo->query("SELECT * FROM promo_codes");
        $promoCodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Found " . count($promoCodes) . " promo codes\n";
        foreach ($promoCodes as $promo) {
            echo "- {$promo['code']}: {$promo['name']}\n";
        }
    } else {
        echo "Promo codes table does not exist\n";
    }
    
    // Test breeds table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM breeds");
    $breedCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Found {$breedCount['count']} breeds\n";
    
    // Test additional services table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM additional_services");
    $serviceCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Found {$serviceCount['count']} additional services\n";
    
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
?>
