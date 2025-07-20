<?php
// Database Discovery Tool - Find your hosting provider's database configuration

echo "<h2>🔍 Database Discovery Tool</h2>\n";
echo "<p>This tool will help you discover the correct database configuration for your hosting provider.</p>\n";

// First, try to connect without specifying a database to see what's available
echo "<h3>🌐 Step 1: Testing MySQL Connection (without database)</h3>\n";

$hosts_to_try = ['localhost', '127.0.0.1'];
$working_host = null;

foreach ($hosts_to_try as $host) {
    echo "<p>Testing host: <strong>$host</strong></p>\n";
    
    try {
        // Try connecting with the expected username but no specific database
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", 'celyspets_celypets', 'hY9cq6KT3$');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<p style='color: green;'>✅ Successfully connected to $host!</p>\n";
        $working_host = $host;
        
        // List all databases this user can access
        echo "<h4>📋 Databases accessible to user 'celyspets_celypets':</h4>\n";
        $stmt = $pdo->query('SHOW DATABASES');
        $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "<ul>\n";
        foreach ($databases as $db) {
            // Skip system databases
            if (!in_array($db, ['information_schema', 'performance_schema', 'mysql', 'sys'])) {
                echo "<li style='font-weight: bold; color: blue;'>$db</li>\n";
            }
        }
        echo "</ul>\n";
        
        break;
        
    } catch (PDOException $e) {
        echo "<p style='color: red;'>❌ Failed to connect to $host: " . htmlspecialchars($e->getMessage()) . "</p>\n";
    }
}

if (!$working_host) {
    echo "<div style='background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336;'>\n";
    echo "<h3>❌ Cannot Connect to MySQL</h3>\n";
    echo "<p>The user 'celyspets_celypets' with password 'hY9cq6KT3$' cannot connect to MySQL.</p>\n";
    
    echo "<h4>🔧 Possible Issues:</h4>\n";
    echo "<ol>\n";
    echo "<li><strong>User doesn't exist:</strong> Create user 'celyspets_celypets' in your hosting control panel</li>\n";
    echo "<li><strong>Wrong password:</strong> Verify password is exactly 'hY9cq6KT3$'</li>\n";
    echo "<li><strong>Wrong username format:</strong> Some hosts use 'youraccount_username' format</li>\n";
    echo "<li><strong>MySQL not enabled:</strong> Enable MySQL in your hosting control panel</li>\n";
    echo "</ol>\n";
    
    echo "<h4>🎯 Quick Fix Instructions:</h4>\n";
    echo "<p><strong>In your hosting control panel:</strong></p>\n";
    echo "<ol>\n";
    echo "<li>Go to <strong>MySQL Databases</strong></li>\n";
    echo "<li>Create database: <code>celyspets_celypets</code></li>\n";
    echo "<li>Create user: <code>celyspets_celypets</code> with password <code>hY9cq6KT3$</code></li>\n";
    echo "<li>Grant <strong>ALL PRIVILEGES</strong> to the user on the database</li>\n";
    echo "<li>Refresh this page to test again</li>\n";
    echo "</ol>\n";
    echo "</div>\n";
    
} else {
    echo "<h3>🎯 Step 2: Testing Specific Database Connection</h3>\n";
    
    // Now test specific database connections
    $possible_db_names = [];
    
    // Get all databases and find likely candidates
    try {
        $pdo = new PDO("mysql:host=$working_host;charset=utf8mb4", 'celyspets_celypets', 'hY9cq6KT3$');
        $stmt = $pdo->query('SHOW DATABASES');
        $all_databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($all_databases as $db) {
            if (strpos($db, 'celyspets') !== false || strpos($db, 'celypets') !== false) {
                $possible_db_names[] = $db;
            }
        }
        
        // Also add our expected name even if not found
        if (!in_array('celyspets_celypets', $possible_db_names)) {
            $possible_db_names[] = 'celyspets_celypets';
        }
        
    } catch (PDOException $e) {
        $possible_db_names = ['celyspets_celypets'];
    }
    
    $working_config = null;
    
    foreach ($possible_db_names as $db_name) {
        echo "<p>Testing database: <strong>$db_name</strong> on host <strong>$working_host</strong></p>\n";
        
        try {
            $pdo = new PDO("mysql:host=$working_host;dbname=$db_name;charset=utf8mb4", 'celyspets_celypets', 'hY9cq6KT3$');
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "<p style='color: green;'>✅ Successfully connected to database '$db_name'!</p>\n";
            
            // Check if it has any tables
            $stmt = $pdo->query('SHOW TABLES');
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (count($tables) > 0) {
                echo "<p>📋 Found " . count($tables) . " tables: " . implode(', ', $tables) . "</p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ Database is empty - this is normal for a new setup</p>\n";
            }
            
            $working_config = [
                'host' => $working_host,
                'database' => $db_name,
                'username' => 'celyspets_celypets',
                'password' => 'hY9cq6KT3$'
            ];
            
            break;
            
        } catch (PDOException $e) {
            echo "<p style='color: red;'>❌ Cannot access database '$db_name': " . htmlspecialchars($e->getMessage()) . "</p>\n";
        }
    }
    
    if ($working_config) {
        echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;'>\n";
        echo "<h2 style='color: green;'>🎉 SUCCESS! Working Configuration Found</h2>\n";
        
        echo "<h4>📝 Your Working Database Configuration:</h4>\n";
        echo "<div style='background: #f8f8f8; padding: 10px; border-radius: 3px; font-family: monospace;'>\n";
        echo "Host: " . $working_config['host'] . "<br>\n";
        echo "Database: " . $working_config['database'] . "<br>\n";
        echo "Username: " . $working_config['username'] . "<br>\n";
        echo "Password: " . $working_config['password'] . "<br>\n";
        echo "</div>\n";
        
        echo "<h4>🔧 Next Steps:</h4>\n";
        echo "<ol>\n";
        echo "<li><strong>Update api/index.php</strong> with these exact settings</li>\n";
        echo "<li><strong>Upload and import</strong> setup-localhost-database.sql via phpMyAdmin</li>\n";
        echo "<li><strong>Test</strong> your website at <a href='/'>the homepage</a></li>\n";
        echo "</ol>\n";
        echo "</div>\n";
        
    } else {
        echo "<div style='background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;'>\n";
        echo "<h3>⚠️ Database Access Issue</h3>\n";
        echo "<p>MySQL connection works, but we cannot access any database with 'celyspets' in the name.</p>\n";
        
        echo "<h4>📋 Available Databases:</h4>\n";
        echo "<ul>\n";
        foreach ($all_databases as $db) {
            if (!in_array($db, ['information_schema', 'performance_schema', 'mysql', 'sys'])) {
                echo "<li>$db</li>\n";
            }
        }
        echo "</ul>\n";
        
        echo "<p><strong>You need to create a database named 'celyspets_celypets' in your hosting control panel.</strong></p>\n";
        echo "</div>\n";
    }
}

echo "<hr>\n";
echo "<p><small>💡 <strong>Tip:</strong> Upload this file to your website and run it at https://celyspets.com/dev/database-discovery.php</small></p>\n";
?>
