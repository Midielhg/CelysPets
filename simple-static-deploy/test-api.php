<?php
// Quick test to show what the fixed appointment format looks like
header('Content-Type: application/json');

// Sample data to show the expected format
$sampleAppointment = [
    'id' => '1',
    'client' => [
        'id' => '1',
        'name' => 'Maria Rodriguez',
        'email' => 'maria@email.com', 
        'phone' => '305-123-4567',
        'address' => '1234 Biscayne Blvd, Miami, FL 33132',
        'pets' => [
            [
                'name' => 'Max',
                'breed' => 'Golden Retriever',
                'age' => 3,
                'type' => null,
                'size' => 'Large'
            ],
            [
                'name' => 'Luna', 
                'breed' => 'Poodle',
                'age' => 2,
                'type' => null,
                'size' => 'Medium'
            ]
        ],
        'notes' => 'Max is very friendly, Luna is a bit shy'
    ],
    'services' => [
        ['name' => 'Full Grooming', 'price' => 65],
        ['name' => 'Nail Trim', 'price' => 15]
    ],
    'date' => '2025-07-22 00:00:00',
    'time' => '11:30 AM',
    'status' => 'pending',
    'notes' => 'Both pets - Max and Luna. Max is very friendly, Luna is shy.',
    'totalAmount' => 0.0,
    'createdAt' => '2025-07-21 23:01:38',
    'updatedAt' => '2025-07-22 22:07:10',
    'groomerId' => '2'
];

echo json_encode([$sampleAppointment], JSON_PRETTY_PRINT);
?>
