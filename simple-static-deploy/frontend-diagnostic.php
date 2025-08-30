<?php
// Frontend API Diagnostic Tool - Debug Frontend API Calls
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>CelysPets Frontend Diagnostic</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow: auto; }
        button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🔍 CelysPets Frontend API Diagnostic</h1>
    <p>This tool tests the API calls that the frontend Users page makes.</p>
    
    <div class="test info">
        <h3>📍 Current Environment</h3>
        <p><strong>Testing URL:</strong> <code>https://celyspets.com/api.php</code></p>
        <p><strong>Auth Token:</strong> <span id="authStatus">Checking...</span></p>
    </div>

    <div class="test">
        <h3>🔒 Step 1: Check Authentication</h3>
        <button onclick="checkAuth()">Test Auth Token (Header)</button>
        <button onclick="testAuthAlternative()">Test Auth Token (Query)</button>
        <div id="authResult"></div>
    </div>

    <div class="test">
        <h3>👥 Step 2: Test Users API</h3>
        <button onclick="testUsers()">Test /users Endpoint</button>
        <div id="usersResult"></div>
    </div>

    <div class="test">
        <h3>📊 Step 3: Test User Stats API</h3>
        <button onclick="testUserStats()">Test /users/stats/overview Endpoint</button>
        <div id="statsResult"></div>
    </div>

    <div class="test">
        <h3>🌐 Step 4: Test Network Connectivity</h3>
        <button onclick="testConnectivity()">Test Basic API Connection</button>
        <div id="connectivityResult"></div>
    </div>

    <script>
        // Check if auth token exists
        function checkAuthToken() {
            const token = localStorage.getItem('auth_token');
            const authStatus = document.getElementById('authStatus');
            if (token) {
                authStatus.innerHTML = `<span style="color: green;">✅ Found: ${token.substring(0, 20)}...</span>`;
                return token;
            } else {
                authStatus.innerHTML = '<span style="color: red;">❌ No auth token found in localStorage</span>';
                return null;
            }
        }

        // Test authentication
        async function checkAuth() {
            const resultDiv = document.getElementById('authResult');
            const token = checkAuthToken();
            
            if (!token) {
                resultDiv.innerHTML = '<div class="error">❌ No auth token found. Please login first.</div>';
                return;
            }

            try {
                resultDiv.innerHTML = '<div class="info">🔄 Testing authentication...</div>';
                
                const response = await fetch('https://celyspets.com/api.php/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<div class="success">✅ Authentication successful<pre>${JSON.stringify(data, null, 2)}</pre></div>`;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Authentication failed<pre>Status: ${response.status}\n${JSON.stringify(data, null, 2)}</pre></div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network error: ${error.message}</div>`;
            }
        }

        // Test with token in query parameter (alternative method)
        async function testAuthAlternative() {
            const resultDiv = document.getElementById('authResult');
            const token = checkAuthToken();
            
            if (!token) {
                resultDiv.innerHTML = '<div class="error">❌ No auth token found. Please login first.</div>';
                return;
            }

            try {
                resultDiv.innerHTML = '<div class="info">🔄 Testing authentication with query parameter...</div>';
                
                const response = await fetch(`https://celyspets.com/api.php/auth/me?token=${encodeURIComponent(token)}`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<div class="success">✅ Authentication successful (query method)<pre>${JSON.stringify(data, null, 2)}</pre></div>`;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Authentication failed (query method)<pre>Status: ${response.status}\n${JSON.stringify(data, null, 2)}</pre></div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network error: ${error.message}</div>`;
            }
        }

        // Test users endpoint
        async function testUsers() {
            const resultDiv = document.getElementById('usersResult');
            const token = checkAuthToken();
            
            if (!token) {
                resultDiv.innerHTML = '<div class="error">❌ No auth token found. Please login first.</div>';
                return;
            }

            try {
                resultDiv.innerHTML = '<div class="info">🔄 Testing users endpoint...</div>';
                
                const response = await fetch('https://celyspets.com/api.php/users?page=1&limit=10', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<div class="success">✅ Users endpoint working<pre>${JSON.stringify(data, null, 2)}</pre></div>`;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Users endpoint failed<pre>Status: ${response.status}\n${JSON.stringify(data, null, 2)}</pre></div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network error: ${error.message}</div>`;
            }
        }

        // Test user stats endpoint
        async function testUserStats() {
            const resultDiv = document.getElementById('statsResult');
            const token = checkAuthToken();
            
            if (!token) {
                resultDiv.innerHTML = '<div class="error">❌ No auth token found. Please login first.</div>';
                return;
            }

            try {
                resultDiv.innerHTML = '<div class="info">🔄 Testing user stats endpoint...</div>';
                
                const response = await fetch('https://celyspets.com/api.php/users/stats/overview', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<div class="success">✅ User stats endpoint working<pre>${JSON.stringify(data, null, 2)}</pre></div>`;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ User stats endpoint failed<pre>Status: ${response.status}\n${JSON.stringify(data, null, 2)}</pre></div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network error: ${error.message}</div>`;
            }
        }

        // Test basic connectivity
        async function testConnectivity() {
            const resultDiv = document.getElementById('connectivityResult');
            
            try {
                resultDiv.innerHTML = '<div class="info">🔄 Testing basic API connectivity...</div>';
                
                const response = await fetch('https://celyspets.com/api.php', {
                    method: 'GET'
                });

                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `<div class="success">✅ Basic API connectivity working<pre>${JSON.stringify(data, null, 2)}</pre></div>`;
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Basic API connectivity failed<pre>Status: ${response.status}\n${JSON.stringify(data, null, 2)}</pre></div>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<div class="error">❌ Network error: ${error.message}</div>`;
            }
        }

        // Initialize on load
        window.onload = function() {
            checkAuthToken();
        };
    </script>
</body>
</html>
