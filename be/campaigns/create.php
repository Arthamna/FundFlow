<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$judul = $input['judul'] ?? '';
$deskripsi = $input['deskripsi'] ?? '';
$target = $input['target_dana'] ?? 0;
$image = $input['image'] ?? ''; 

if (empty($judul) || empty($deskripsi) || $target <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input data']);
    exit;
}

$db = Database::getInstance()->getConnection();
$sql = "INSERT INTO ajuan_donasi (id_user_fk, judul, deskripsi, target_dana, status) VALUES (?, ?, ?, ?, 'Pending')";
$stmt = $db->prepare($sql);
$userId = $_SESSION['user_id'];
$stmt->bind_param('issd', $userId, $judul, $deskripsi, $target);

if ($stmt->execute()) {
    $newId = $stmt->insert_id;
    // Return data dummy yg mirip format normalize
    echo json_encode([
        'success' => true, 
        'data' => [
            'id_ajuan' => $newId,
            'judul' => $judul,
            'status' => 'Pending'
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}