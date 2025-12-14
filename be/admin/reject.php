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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin only']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = $input['id_ajuan'] ?? 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit;
}

$db = Database::getInstance()->getConnection();

// FIX: Hapus koma sebelum WHERE, hapus catatan karena tidak ada di schema
$stmt = $db->prepare("UPDATE ajuan_donasi SET status = 'Rejected', id_admin_fk = ? WHERE id_ajuan = ?");
$adminId = $_SESSION['user_id'];

// FIX: bind_param 'ii' untuk 2 integer (adminId, id)
$stmt->bind_param('ii', $adminId, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Campaign rejected']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}

$stmt->close();
?>