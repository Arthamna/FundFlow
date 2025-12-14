<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

$id = $_GET['id'] ?? 0;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing ID']);
    exit;
}

$db = Database::getInstance()->getConnection();

$sql = "SELECT a.*, u.username as owner_name, u.email as owner_email 
        FROM ajuan_donasi a 
        JOIN user u ON a.id_user_fk = u.id_user 
        WHERE a.id_ajuan = ?";

$stmt = $db->prepare($sql);
$stmt->bind_param('i', $id);
$stmt->execute();
$res = $stmt->get_result();
$data = $res->fetch_assoc();

if ($data) {
    echo json_encode(['success' => true, 'data' => [$data]]); // Array bungkus agar sesuai normalizer frontend
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Campaign not found']);
}