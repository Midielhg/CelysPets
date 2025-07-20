<?php
// Simple PHP Test - Check if PHP and API directory are working

echo "<h2>🧪 PHP API Test</h2>\n";
echo "<p>Testing PHP execution and API directory access...</p>\n";

echo "<h3>✅ PHP is working!</h3>\n";
echo "<p>PHP Version: " . phpversion() . "</p>\n";
echo "<p>Current file location: " . __FILE__ . "</p>\n";
echo "<p>Current directory: " . __DIR__ . "</p>\n";

echo "<h3>📁 Directory Contents:</h3>\n";
$files = scandir(__DIR__);
echo "<ul>\n";
foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        echo "<li>$file</li>\n";
    }
}
echo "</ul>\n";

echo "<h3>🔍 Checking for main API file:</h3>\n";
if (file_exists(__DIR__ . '/index.php')) {
    echo "<p style='color: green;'>✅ index.php exists in api directory</p>\n";
    $size = filesize(__DIR__ . '/index.php');
    echo "<p>File size: " . number_format($size) . " bytes</p>\n";
} else {
    echo "<p style='color: red;'>❌ index.php NOT found in api directory</p>\n";
}

echo "<h3>🌐 Testing Direct API Access:</h3>\n";
echo "<p>If this test works, try accessing the API directly:</p>\n";
echo "<ul>\n";
echo "<li><a href='index.php?test=1'>Direct API Test</a></li>\n";
echo "<li><a href='../api/health'>API Health via .htaccess</a></li>\n";
echo "</ul>\n";

echo "<h3>🔧 Troubleshooting:</h3>\n";
echo "<p>If the API still doesn't work:</p>\n";
echo "<ol>\n";
echo "<li>Make sure .htaccess is in the website root directory</li>\n";
echo "<li>Check if mod_rewrite is enabled (contact hosting support)</li>\n";
echo "<li>Try accessing the API directly: /api/index.php</li>\n";
echo "</ol>\n";
?>
