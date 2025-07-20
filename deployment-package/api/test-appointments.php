<?php
// Test Appointments Endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo "<h2>🧪 Appointments Endpoint Test</h2>\n";

// Test the appointments endpoint
echo "<h3>Testing appointments.php...</h3>\n";

$testUrl = '/api/appointments.php';
$fullUrl = 'https://celyspets.com/dev' . $testUrl;

echo "<p>Testing URL: <a href='$testUrl' target='_blank'>$testUrl</a></p>\n";

// Database configuration
$host = 'localhost';
$database = 'celyspets_celypets';
$username = 'celyspets_celypets';
$password = 'hY9cq6KT3$';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ Database connection successful</p>\n";
    
    // Test query
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM appointments');
    $result = $stmt->fetch();
    $count = $result['count'];
    
    echo "<p style='color: green;'>✅ Found $count appointments in database</p>\n";
    
    if ($count > 0) {
        // Get sample appointment
        $stmt = $pdo->query('SELECT * FROM appointments LIMIT 1');
        $sample = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "<h4>Sample Appointment (Raw Database):</h4>\n";
        echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>\n";
        echo json_encode($sample, JSON_PRETTY_PRINT);
        echo "</pre>\n";
        
        // Transform the data like our API does
        $datetime = new DateTime($sample['appointment_date']);
        $date = $datetime->format('Y-m-d');
        $time = $datetime->format('g:i A');
        
        $transformed = [
            '_id' => (string)$sample['id'],
            'id' => $sample['id'],
            'client' => [
                'name' => $sample['client_name'],
                'address' => $sample['client_address'],
                'phone' => $sample['client_phone'],
                'email' => $sample['client_email'] ?? ''
            ],
            'date' => $date,
            'time' => $time,
            'appointment_date' => $sample['appointment_date'],
            'services' => !empty($sample['service_type']) ? explode(',', $sample['service_type']) : [],
            'service_type' => $sample['service_type'],
            'status' => $sample['status'],
            'notes' => $sample['notes'] ?? ''
        ];
        
        echo "<h4>Transformed for Frontend:</h4>\n";
        echo "<pre style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>\n";
        echo json_encode($transformed, JSON_PRETTY_PRINT);
        echo "</pre>\n";
        
        echo "<h4>🧪 Direct API Test:</h4>\n";
        echo "<p><a href='appointments.php' target='_blank'>Test appointments.php directly</a></p>\n";
        echo "<p><a href='appointments.php?date=" . date('Y-m-d') . "' target='_blank'>Test with today's date</a></p>\n";
    } else {
        echo "<p style='color: orange;'>⚠️ No appointments found in database</p>\n";
        echo "<p>You might need to create some test appointments first.</p>\n";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database error: " . htmlspecialchars($e->getMessage()) . "</p>\n";
}

echo "<hr>\n";
echo "<h3>🔗 Quick Links:</h3>\n";
echo "<ul>\n";
echo "<li><a href='appointments.php' target='_blank'>Test appointments.php</a></li>\n";
echo "<li><a href='login.php' target='_blank'>Test login.php</a></li>\n";
echo "<li><a href='health.php' target='_blank'>Test health.php</a></li>\n";
echo "<li><a href='../'>Back to website</a></li>\n";
echo "</ul>\n";
?>
