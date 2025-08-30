<?php
// CelysPets Database Diagnostic Tool
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>CelysPets Database Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #16a085; background: #d5f4e6; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { color: #e74c3c; background: #fdeaea; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .info { color: #3498db; background: #e8f4f8; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .warning { color: #f39c12; background: #fef5e7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .step { margin: 20px 0; padding: 20px; border-left: 4px solid #3498db; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 CelysPets Database Diagnostic</h1>
        
        <?php
        // Test 1: PHP Version
        echo "<div class='step'>";
        echo "<h3>Step 1: PHP Version Check</h3>";
        $phpVersion = phpversion();
        if (version_compare($phpVersion, '7.4.0', '>=')) {
            echo "<div class='success'>✅ PHP Version: $phpVersion (Compatible)</div>";
        } else {
            echo "<div class='error'>❌ PHP Version: $phpVersion (Needs 7.4+)</div>";
        }
        echo "</div>";

        // Test 2: PDO Extension
        echo "<div class='step'>";
        echo "<h3>Step 2: PDO Extension Check</h3>";
        if (extension_loaded('pdo') && extension_loaded('pdo_mysql')) {
            echo "<div class='success'>✅ PDO and PDO MySQL extensions are loaded</div>";
        } else {
            echo "<div class='error'>❌ PDO extensions missing</div>";
            echo "<div class='info'>Extensions loaded: " . implode(', ', get_loaded_extensions()) . "</div>";
        }
        echo "</div>";

        // Test 3: Database Connection with different configurations
        echo "<div class='step'>";
        echo "<h3>Step 3: Database Connection Tests</h3>";
        
        // Configuration options to try
        $configs = [
            [
                'host' => 'localhost',
                'dbname' => 'celyspets_celypets',
                'username' => 'celyspets_celypets',
                'password' => 'nCvCE42v6_',
                'name' => 'Production Config (current)'
            ],
            [
                'host' => 'localhost',
                'dbname' => 'celyspets',
                'username' => 'celyspets',
                'password' => 'nCvCE42v6_',
                'name' => 'Alternative Config 1'
            ],
            [
                'host' => 'localhost',
                'dbname' => 'celypets',
                'username' => 'celypets',
                'password' => 'nCvCE42v6_',
                'name' => 'Alternative Config 2'
            ]
        ];

        foreach ($configs as $config) {
            echo "<h4>Testing: {$config['name']}</h4>";
            echo "<div class='info'>Host: {$config['host']}<br>Database: {$config['dbname']}<br>Username: {$config['username']}</div>";
            
            try {
                $pdo = new PDO("mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8", 
                              $config['username'], $config['password']);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Test query
                $stmt = $pdo->query("SELECT VERSION() as version, DATABASE() as current_db");
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo "<div class='success'>✅ Connection successful!</div>";
                echo "<div class='info'>MySQL Version: {$result['version']}<br>Current Database: {$result['current_db']}</div>";
                
                // Check if tables exist
                $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                if (count($tables) > 0) {
                    echo "<div class='success'>📊 Found " . count($tables) . " tables: " . implode(', ', $tables) . "</div>";
                } else {
                    echo "<div class='warning'>⚠️ Database is empty - no tables found</div>";
                }
                
                // This config works, so we'll use it
                $workingConfig = $config;
                break;
                
            } catch (PDOException $e) {
                echo "<div class='error'>❌ Connection failed: " . $e->getMessage() . "</div>";
            }
        }
        echo "</div>";

        // Test 4: Check if admin user exists (if we have a working connection)
        if (isset($workingConfig)) {
            echo "<div class='step'>";
            echo "<h3>Step 4: Admin User Check</h3>";
            
            try {
                $pdo = new PDO("mysql:host={$workingConfig['host']};dbname={$workingConfig['dbname']};charset=utf8", 
                              $workingConfig['username'], $workingConfig['password']);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Check if users table exists
                $tableExists = $pdo->query("SHOW TABLES LIKE 'users'")->rowCount() > 0;
                
                if ($tableExists) {
                    echo "<div class='success'>✅ Users table exists</div>";
                    
                    // Check for admin user
                    $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE email = ? OR role = 'admin'");
                    $stmt->execute(['admin@celyspets.com']);
                    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (count($admins) > 0) {
                        echo "<div class='success'>✅ Found admin users:</div>";
                        foreach ($admins as $admin) {
                            echo "<div class='info'>ID: {$admin['id']}, Email: {$admin['email']}, Role: {$admin['role']}</div>";
                        }
                    } else {
                        echo "<div class='warning'>⚠️ No admin users found</div>";
                        echo "<div class='info'>🔧 Run the setup script to create admin user</div>";
                    }
                } else {
                    echo "<div class='warning'>⚠️ Users table doesn't exist</div>";
                    echo "<div class='info'>🔧 Database needs to be initialized</div>";
                }
                
            } catch (PDOException $e) {
                echo "<div class='error'>❌ Error checking admin user: " . $e->getMessage() . "</div>";
            }
            echo "</div>";

            // Generate corrected config
            echo "<div class='step'>";
            echo "<h3>Step 5: Recommended Configuration</h3>";
            echo "<div class='success'>✅ Use this configuration in your api.php:</div>";
            echo "<pre>";
            echo "\$host = '{$workingConfig['host']}';\n";
            echo "\$dbname = '{$workingConfig['dbname']}';\n";
            echo "\$username = '{$workingConfig['username']}';\n";
            echo "\$password = '{$workingConfig['password']}';";
            echo "</pre>";
            echo "</div>";
        }

        // Test 5: Server information
        echo "<div class='step'>";
        echo "<h3>Step 6: Server Information</h3>";
        echo "<div class='info'>";
        echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "<br>";
        echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown') . "<br>";
        echo "Script Filename: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'Unknown') . "<br>";
        echo "HTTP Host: " . ($_SERVER['HTTP_HOST'] ?? 'Unknown') . "<br>";
        echo "</div>";
        echo "</div>";
        ?>

        <div class="step">
            <h3>🔧 Next Steps</h3>
            <div class="info">
                <ol>
                    <li><strong>If connection successful:</strong> Update your api.php with the working configuration above</li>
                    <li><strong>If no admin user found:</strong> Visit <code>/setup-admin.php</code> to create admin user</li>
                    <li><strong>If database is empty:</strong> The API will auto-create tables on first use</li>
                    <li><strong>If connection failed:</strong> Contact your hosting provider for correct database credentials</li>
                </ol>
            </div>
        </div>

        <div class="step">
            <h3>🚨 Security Notice</h3>
            <div class="warning">
                <strong>Important:</strong> Delete this diagnostic file (db-diagnostic.php) after resolving the database issues for security reasons.
            </div>
        </div>
    </div>
</body>
</html>
