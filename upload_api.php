<?php
// Temporary upload script - copy this file to the server and run it once
if (isset($_GET['upload'])) {
    $apiContent = file_get_contents('dist/api.php');
    if (file_put_contents('/home/midiel/public_html/api.php', $apiContent)) {
        echo "API updated successfully!";
    } else {
        echo "Failed to update API";
    }
} else {
    echo "Add ?upload=1 to URL to upload";
}
?>
