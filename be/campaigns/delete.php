<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

if (!isset($_SESSION['user_id'])) { http_response_code(401); exit; }

$input = json_decode(file_get_contents("php://input"), true);
$id = $input['id_ajuan'] ?? 0;

$db = Database::getInstance()->getConnection();
// Hanya pemilik yang boleh hapus
$sql = "DELETE FROM ajuan_donasi WHERE id_ajuan = ? AND id_user_fk = ?";
$stmt = $db->prepare($sql);
$stmt->bind_param('ii', $id, $_SESSION['user_id']);
$stmt->execute();

echo json_encode(['success' => true]);