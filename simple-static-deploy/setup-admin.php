<?php
// CelysPets Admin Setup Script
header('Content-Type: text/html; charset=utf-8');

// Database configuration - Update these with your working credentials
$host = 'localhost';
$dbname = 'celyspets_celypets';  // Change this to your actual database name
$username = 'celyspets_celypets'; // Change this to your actual username
$password = 'nCvCE42v6_';         // Change this to your actual password

?>
<!DOCTYPE html>
<html>
<head>
    <title>CelysPets Admin Setup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
        .success { color: #16a085; background: #d5f4e6; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .error { color: #e74c3c; background: #fdeaea; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .info { color: #3498db; background: #e8f4f8; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .warning { color: #f39c12; background: #fef5e7; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="email"], input[type="password"] { 
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; 
        }
        button { 
            background: #3498db; color: white; padding: 12px 30px; border: none; border-radius: 4px; 
            cursor: pointer; font-size: 16px; margin: 10px 5px;
        }
        button:hover { background: #2980b9; }
        .danger { background: #e74c3c; }
        .danger:hover { background: #c0392b; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 CelysPets Admin Setup</h1>
        
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = $_POST['action'] ?? '';
            
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                if ($action === 'create_tables') {
                    // Create all necessary tables
                    echo "<div class='info'>Creating database tables...</div>";
                    
                    // Users table
                    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        role ENUM('client', 'admin', 'groomer') DEFAULT 'client',
                        businessSettings JSON NULL,
                        googleTokens JSON NULL,
                        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_email (email),
                        INDEX idx_role (role)
                    )");

                    // Clients table
                    $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255),
                        phone VARCHAR(50),
                        address TEXT,
                        notes TEXT,
                        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_email (email),
                        INDEX idx_phone (phone)
                    )");

                    // Pets table
                    $pdo->exec("CREATE TABLE IF NOT EXISTS pets (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        clientId INT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        species ENUM('dog', 'cat') DEFAULT 'dog',
                        breed VARCHAR(255),
                        age INT,
                        weight DECIMAL(5,2),
                        notes TEXT,
                        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
                        INDEX idx_client (clientId),
                        INDEX idx_species (species)
                    )");

                    // Appointments table
                    $pdo->exec("CREATE TABLE IF NOT EXISTS appointments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        clientId INT NOT NULL,
                        petIds JSON,
                        services JSON,
                        date DATE NOT NULL,
                        time TIME NOT NULL,
                        endTime TIME,
                        duration INT DEFAULT 60,
                        assignedGroomer VARCHAR(255),
                        status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
                        notes TEXT,
                        totalAmount DECIMAL(8,2),
                        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
                        INDEX idx_client (clientId),
                        INDEX idx_date (date),
                        INDEX idx_status (status)
                    )");

                    echo "<div class='success'>✅ Database tables created successfully!</div>";
                    
                } elseif ($action === 'create_admin') {
                    $adminEmail = $_POST['admin_email'] ?? 'admin@celyspets.com';
                    $adminPassword = $_POST['admin_password'] ?? 'admin123';
                    $adminName = $_POST['admin_name'] ?? 'Administrator';
                    
                    // Check if admin already exists
                    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                    $stmt->execute([$adminEmail]);
                    
                    if ($stmt->rowCount() > 0) {
                        echo "<div class='warning'>⚠️ Admin user with email '$adminEmail' already exists!</div>";
                    } else {
                        // Create admin user
                        $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
                        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')");
                        $stmt->execute([$adminEmail, $hashedPassword, $adminName]);
                        
                        echo "<div class='success'>✅ Admin user created successfully!</div>";
                        echo "<div class='info'>";
                        echo "<strong>Login Credentials:</strong><br>";
                        echo "Email: $adminEmail<br>";
                        echo "Password: $adminPassword<br>";
                        echo "Role: admin";
                        echo "</div>";
                    }
                    
                } elseif ($action === 'reset_admin') {
                    $newPassword = $_POST['new_password'] ?? 'admin123';
                    
                    // Reset admin password
                    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE role = 'admin' OR email = 'admin@celyspets.com'");
                    $stmt->execute([$hashedPassword]);
                    
                    if ($stmt->rowCount() > 0) {
                        echo "<div class='success'>✅ Admin password reset successfully!</div>";
                        echo "<div class='info'>New password: $newPassword</div>";
                    } else {
                        echo "<div class='error'>❌ No admin users found to reset</div>";
                    }
                }
                
            } catch (PDOException $e) {
                echo "<div class='error'>❌ Database Error: " . $e->getMessage() . "</div>";
                echo "<div class='warning'>Please check your database configuration at the top of this file.</div>";
            }
        }

        // Check current status
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo "<div class='success'>✅ Database connection successful</div>";
            echo "<div class='info'>Database: $dbname | Host: $host</div>";
            
            // Check tables
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            $requiredTables = ['users', 'clients', 'pets', 'appointments'];
            $missingTables = array_diff($requiredTables, $tables);
            
            if (empty($missingTables)) {
                echo "<div class='success'>✅ All required tables exist</div>";
            } else {
                echo "<div class='warning'>⚠️ Missing tables: " . implode(', ', $missingTables) . "</div>";
            }
            
            // Check admin users
            if (in_array('users', $tables)) {
                $stmt = $pdo->query("SELECT id, email, name, role FROM users WHERE role = 'admin'");
                $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($admins) > 0) {
                    echo "<div class='success'>✅ Found " . count($admins) . " admin user(s):</div>";
                    foreach ($admins as $admin) {
                        echo "<div class='info'>• {$admin['name']} ({$admin['email']})</div>";
                    }
                } else {
                    echo "<div class='warning'>⚠️ No admin users found</div>";
                }
            }
            
        } catch (PDOException $e) {
            echo "<div class='error'>❌ Database connection failed: " . $e->getMessage() . "</div>";
            echo "<div class='warning'>Please update the database configuration at the top of this file with your correct credentials.</div>";
        }
        ?>

        <hr style="margin: 30px 0;">

        <!-- Create Tables Form -->
        <form method="POST" style="margin: 20px 0;">
            <h3>1. Create Database Tables</h3>
            <p>Create all necessary tables for CelysPets (users, clients, pets, appointments)</p>
            <input type="hidden" name="action" value="create_tables">
            <button type="submit">Create Database Tables</button>
        </form>

        <!-- Create Admin Form -->
        <form method="POST" style="margin: 20px 0;">
            <h3>2. Create Admin User</h3>
            <input type="hidden" name="action" value="create_admin">
            
            <div class="form-group">
                <label for="admin_name">Admin Name:</label>
                <input type="text" id="admin_name" name="admin_name" value="Administrator" required>
            </div>
            
            <div class="form-group">
                <label for="admin_email">Admin Email:</label>
                <input type="email" id="admin_email" name="admin_email" value="admin@celyspets.com" required>
            </div>
            
            <div class="form-group">
                <label for="admin_password">Admin Password:</label>
                <input type="password" id="admin_password" name="admin_password" value="admin123" required>
            </div>
            
            <button type="submit">Create Admin User</button>
        </form>

        <!-- Reset Admin Password Form -->
        <form method="POST" style="margin: 20px 0;">
            <h3>3. Reset Admin Password</h3>
            <p>Reset password for existing admin users</p>
            <input type="hidden" name="action" value="reset_admin">
            
            <div class="form-group">
                <label for="new_password">New Password:</label>
                <input type="password" id="new_password" name="new_password" value="admin123" required>
            </div>
            
            <button type="submit" class="danger">Reset Admin Password</button>
        </form>

        <div class="warning">
            <h3>🚨 Security Notice</h3>
            <p><strong>Important:</strong> Delete this setup file (setup-admin.php) after completing the setup for security reasons.</p>
        </div>

        <div class="info">
            <h3>📋 Database Configuration</h3>
            <p>If you need to update the database credentials, edit the configuration at the top of this file:</p>
            <pre>
$host = '$host';
$dbname = '$dbname';
$username = '$username';
$password = '$password';
            </pre>
        </div>
    </div>
</body>
</html>
