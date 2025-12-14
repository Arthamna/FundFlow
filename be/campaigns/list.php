<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';

// CORS headers
$allowedOrigins = [
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$db = Database::getInstance()->getConnection();
$userId = $_SESSION['user_id'];

// Ambil semua campaign (Verified + milik user sendiri)
$sql = "SELECT a.*, u.username as owner_name, u.email as owner_email 
        FROM ajuan_donasi a 
        JOIN user u ON a.id_user_fk = u.id_user 
        WHERE a.status = 'Verified' OR a.id_user_fk = ? ";

$stmt = $db->prepare($sql);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'id' => (int)$row['id_ajuan'],
        'title' => $row['judul'],
        'desc' => $row['deskripsi'],
        'target' => (int)$row['target_dana'],
        'collected' => (int)$row['terkumpul_dana'],
        'status' => $row['status'],
        'image_path' => $row['image_path'],
        'owner' => $row['owner_email'],
        'owner_name' => $row['owner_name']
    ];
}

echo json_encode(['success' => true, 'data' => $data]);
?>