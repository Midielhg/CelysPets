<?php
// Enhanced PHP Database Connection Test - Multiple Configurations

echo "<h2>🔧 Enhanced PHP Database Connection Test</h2>\n";
echo "<p>Testing multiple connection methods to find the right configuration...</p>\n";

// Database configuration options to try
$configs = [
    [
        'name' => 'Standard localhost',
        'host' => 'localhost',
        'database' => 'celyspets_celypets',
        'username' => 'celyspets_celypets',
        'password' => 'hY9cq6KT3$'
    ],
    [
        'name' => '127.0.0.1 instead of localhost',
        'host' => '127.0.0.1',
        'database' => 'celyspets_celypets',
        'username' => 'celyspets_celypets',
        'password' => 'hY9cq6KT3$'
    ],
    [
        'name' => 'Truncated names (some hosts limit length)',
        'host' => 'localhost',
        'database' => 'celyspet_celypets',
        'username' => 'celyspet_celypets',
        'password' => 'hY9cq6KT3$'
    ],
    [
        'name' => 'Username prefix format',
        'host' => 'localhost',
        'database' => 'celyspet_celypets',
        'username' => 'celyspet_celyspet',
        'password' => 'hY9cq6KT3$'
    ]
];

$successful_config = null;

foreach ($configs as $index => $config) {
    echo "<h3>📋 Testing Configuration #" . ($index + 1) . ": " . $config['name'] . "</h3>\n";
    echo "<ul>\n";
    echo "<li><strong>Host:</strong> " . $config['host'] . "</li>\n";
    echo "<li><strong>Database:</strong> " . $config['database'] . "</li>\n";
    echo "<li><strong>Username:</strong> " . $config['username'] . "</li>\n";
    echo "<li><strong>Password:</strong> " . str_repeat('*', strlen($config['password'])) . "</li>\n";
    echo "</ul>\n";

    try {
        echo "<p>🔌 Testing connection...</p>\n";
        
        $pdo = new PDO("mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4", $config['username'], $config['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<p style='color: green;'>✅ <strong>Configuration #" . ($index + 1) . " - Connection successful!</strong></p>\n";
        $successful_config = $config;
        
        // Test basic query
        echo "<p>🧪 Testing database query...</p>\n";
        $stmt = $pdo->query('SELECT 1 as test');
        $result = $stmt->fetch();
        echo "<p style='color: green;'>✅ <strong>Database query works!</strong></p>\n";
        
        // Check if tables exist
        echo "<p>📋 Checking tables...</p>\n";
        $stmt = $pdo->query('SHOW TABLES');
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($tables) > 0) {
            echo "<p style='color: green;'>✅ <strong>Found " . count($tables) . " tables:</strong></p>\n";
            echo "<ul>\n";
            foreach ($tables as $table) {
                echo "<li>$table</li>\n";
            }
            echo "</ul>\n";
        } else {
            echo "<p style='color: orange;'>⚠️ <strong>Database is empty - need to import schema</strong></p>\n";
        }
        
        // Check for admin user if users table exists
        if (in_array('users', $tables)) {
            echo "<p>👤 Checking for admin user...</p>\n";
            $stmt = $pdo->prepare('SELECT email FROM users WHERE email = ?');
            $stmt->execute(['admin@celyspets.com']);
            $admin = $stmt->fetch();
            
            if ($admin) {
                echo "<p style='color: green;'>✅ <strong>Admin user exists</strong></p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ <strong>Admin user not found - need to import data</strong></p>\n";
            }
        }
        
        break; // Stop testing once we find a working config
        
    } catch (PDOException $e) {
        echo "<p style='color: red;'>❌ <strong>Configuration #" . ($index + 1) . " failed:</strong> " . htmlspecialchars($e->getMessage()) . "</p>\n";
        echo "<hr>\n";
    }
}

if ($successful_config) {
    echo "<h2 style='color: green;'>🎉 SUCCESS!</h2>\n";
    echo "<p><strong>Working configuration found:</strong></p>\n";
    echo "<div style='background: #f0f8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba;'>\n";
    echo "<h4>📝 Copy these settings to your api/index.php:</h4>\n";
    echo "<pre style='background: #f8f8f8; padding: 10px; border-radius: 3px; overflow-x: auto;'>\n";
    echo "\$host = '" . $successful_config['host'] . "';\n";
    echo "\$database = '" . $successful_config['database'] . "';\n";
    echo "\$username = '" . $successful_config['username'] . "';\n";
    echo "\$password = '" . $successful_config['password'] . "';\n";
    echo "</pre>\n";
    echo "</div>\n";
    
    echo "<p><strong>📝 Next steps:</strong></p>\n";
    echo "<ol>\n";
    echo "<li><strong>Update api/index.php:</strong> Replace the database credentials with the working ones above</li>\n";
    if (!in_array('users', $stmt->fetchAll(PDO::FETCH_COLUMN))) {
        echo "<li><strong>Import database schema:</strong> Upload <code>setup-localhost-database.sql</code> via phpMyAdmin</li>\n";
    }
    echo "<li><strong>Test API:</strong> Visit <a href='api/health'>api/health</a></li>\n";
    echo "<li><strong>Test website:</strong> Visit <a href='/'>your website</a></li>\n";
    echo "<li><strong>Login test:</strong> admin@celyspets.com / admin123</li>\n";
    echo "</ol>\n";
} else {
    echo "<h2 style='color: red;'>❌ ALL CONFIGURATIONS FAILED</h2>\n";
    
    echo "<div style='background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;'>\n";
    echo "<h3>🔍 Step-by-Step Troubleshooting:</h3>\n";
    
    echo "<h4>1. 🏠 Check Your Hosting Control Panel</h4>\n";
    echo "<ul>\n";
    echo "<li>Go to <strong>MySQL Databases</strong> or <strong>Database</strong> section</li>\n";
    echo "<li>Look for existing databases - note the exact name format</li>\n";
    echo "<li>Look for existing users - note the exact username format</li>\n";
    echo "</ul>\n";
    
    echo "<h4>2. 🆕 Create Database (if missing)</h4>\n";
    echo "<ol>\n";
    echo "<li><strong>Database Name:</strong> Try 'celyspets_celypets' first</li>\n";
    echo "<li><strong>Create User:</strong> 'celyspets_celypets' with password 'hY9cq6KT3$'</li>\n";
    echo "<li><strong>Grant Privileges:</strong> Give user ALL privileges on the database</li>\n";
    echo "</ol>\n";
    
    echo "<h4>3. 🏷️ Common Hosting Name Patterns</h4>\n";
    echo "<ul>\n";
    echo "<li><strong>cPanel:</strong> Often uses prefix like 'username_dbname'</li>\n";
    echo "<li><strong>Length limits:</strong> Some hosts truncate long names</li>\n";
    echo "<li><strong>Case sensitive:</strong> Try all lowercase versions</li>\n";
    echo "</ul>\n";
    
    echo "<h4>4. 🌐 Alternative Hosts to Try</h4>\n";
    echo "<ul>\n";
    echo "<li><strong>127.0.0.1</strong> instead of localhost</li>\n";
    echo "<li><strong>Your domain name</strong> (e.g., celyspets.com)</li>\n";
    echo "<li><strong>mysql.yourhostingprovider.com</strong></li>\n";
    echo "</ul>\n";
    
    echo "<h4>5. 📞 Contact Hosting Support</h4>\n";
    echo "<p>Ask them: 'What are the correct MySQL connection details for my account?'</p>\n";
    echo "</div>\n";
}

echo "<hr>\n";
echo "<p><small>🕒 Test completed at " . date('Y-m-d H:i:s') . "</small></p>\n";
?>
