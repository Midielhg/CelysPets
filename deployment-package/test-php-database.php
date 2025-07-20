<?php
// PHP Database Connection Test for Localhost MySQL

echo "<h2>🔧 PHP Database Connection Test</h2>\n";
echo "<p>Testing multiple connection methods to find the right configuration...</p>\n";

// Database configuration options to try
$configs = [
    [
        'host' => 'localhost',
        'database' => 'celyspets_celypets',
        'username' => 'celyspets_celypets',
        'password' => 'hY9cq6KT3$'
    ],
    [
        'host' => '127.0.0.1',
        'database' => 'celyspets_celypets',
        'username' => 'celyspets_celypets',
        'password' => 'hY9cq6KT3$'
    ],
    [
        'host' => 'localhost',
        'database' => 'celyspet_celypets',  // Some hosts truncate names
        'username' => 'celyspet_celypets',
        'password' => 'hY9cq6KT3$'
    ]
];

$successful_config = null;

foreach ($configs as $index => $config) {
    $host = $config['host'];
    $database = $config['database'];
    $username = $config['username'];
    $password = $config['password'];
    
    echo "<h3>📋 Testing Configuration #" . ($index + 1) . ":</h3>\n";
    echo "<ul>\n";
    echo "<li><strong>Host:</strong> $host</li>\n";
    echo "<li><strong>Database:</strong> $database</li>\n";
    echo "<li><strong>Username:</strong> $username</li>\n";
    echo "<li><strong>Password:</strong> " . str_repeat('*', strlen($password)) . "</li>\n";
    echo "</ul>\n";

    try {
        echo "<p>🔌 Testing connection...</p>\n";
        
        $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ <strong>Database connection successful!</strong></p>\n";
    
    // Test basic query
    echo "<h3>🧪 Testing Database Query...</h3>\n";
    $stmt = $pdo->query('SELECT 1 as test');
    $result = $stmt->fetch();
    echo "<p style='color: green;'>✅ <strong>Database query works!</strong></p>\n";
    
    // Check if tables exist
    echo "<h3>📋 Checking Tables...</h3>\n";
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo "<p style='color: green;'>✅ <strong>Tables found:</strong> " . implode(', ', $tables) . "</p>\n";
        
        // Check if admin user exists
        if (in_array('users', $tables)) {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM users WHERE email = "admin@celyspets.com"');
            $adminCount = $stmt->fetch()['count'];
            
            if ($adminCount > 0) {
                echo "<p style='color: green;'>✅ <strong>Admin user exists!</strong></p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ <strong>Admin user not found.</strong> Make sure to import setup-localhost-database.sql</p>\n";
            }
        }
        
        // Check sample data
        if (in_array('appointments', $tables)) {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM appointments');
            $appointmentCount = $stmt->fetch()['count'];
            echo "<p style='color: green;'>📅 <strong>Appointments:</strong> $appointmentCount</p>\n";
        }
        
        if (in_array('clients', $tables)) {
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM clients');
            $clientCount = $stmt->fetch()['count'];
            echo "<p style='color: green;'>👥 <strong>Clients:</strong> $clientCount</p>\n";
        }
        
    } else {
        echo "<p style='color: red;'>❌ <strong>No tables found!</strong> Please import setup-localhost-database.sql via phpMyAdmin</p>\n";
    }
    
    echo "<h3>🎉 Test Results:</h3>\n";
    echo "<p style='color: green; font-size: 18px;'><strong>✅ PHP Backend is ready to work!</strong></p>\n";
    echo "<ul>\n";
    echo "<li>✅ Database connection successful</li>\n";
    echo "<li>✅ PHP is working properly</li>\n";
    echo "<li>✅ MySQL is accessible</li>\n";
    echo "</ul>\n";
    
    echo "<h3>🚀 Next Steps:</h3>\n";
    echo "<ol>\n";
    echo "<li>Test the API: <a href='api/health' target='_blank'>api/health</a></li>\n";
    echo "<li>Visit your website: <a href='index.html' target='_blank'>index.html</a></li>\n";
    echo "<li>Login with: admin@celyspets.com / admin123</li>\n";
    echo "</ol>\n";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ <strong>Database connection failed:</strong> " . htmlspecialchars($e->getMessage()) . "</p>\n";
    
    echo "<h3>🔍 Troubleshooting Tips:</h3>\n";
    echo "<ul>\n";
    
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "<li>❌ <strong>Access denied:</strong> Check username/password in your hosting control panel</li>\n";
        echo "<li>🔧 Verify user 'celyspets_celypets' exists with password 'hY9cq6KT3$'</li>\n";
        echo "<li>🔧 Make sure user has ALL privileges on database 'celyspets_celypets'</li>\n";
    } elseif (strpos($e->getMessage(), 'Unknown database') !== false) {
        echo "<li>❌ <strong>Database not found:</strong> Create database 'celyspets_celypets' in your hosting control panel</li>\n";
    } elseif (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "<li>❌ <strong>MySQL not running:</strong> Contact your hosting provider</li>\n";
    } else {
        echo "<li>❌ <strong>General error:</strong> Check your hosting control panel for MySQL status</li>\n";
    }
    
    echo "</ul>\n";
    
    echo "<h3>🔧 Alternative Solutions:</h3>\n";
    echo "<ol>\n";
    echo "<li>Try host '127.0.0.1' instead of 'localhost'</li>\n";
    echo "<li>Check if your hosting uses different database naming (like username_dbname)</li>\n";
    echo "<li>Contact hosting support for MySQL configuration</li>\n";
    echo "</ol>\n";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h2 { color: #333; }
h3 { color: #666; margin-top: 20px; }
ul, ol { margin: 10px 0; }
li { margin: 5px 0; }
a { color: #007cba; }
</style>
