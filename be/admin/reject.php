<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403); exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = $input['id_ajuan'] ?? 0;
$reason = $input['reason'] ?? 'Rejected by admin';

$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("UPDATE ajuan_donasi SET status = 'Rejected', catatan = ? WHERE id_ajuan = ?");
$stmt->bind_param('si', $reason, $id);
$stmt->execute();

echo json_encode(['success' => true]);