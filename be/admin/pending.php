<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

// Cek Role Admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin only']);
    exit;
}

$db = Database::getInstance()->getConnection();
// Ambil yang Pending ATAU Rejected (untuk dilihat history bandingnya)
$sql = "SELECT a.*, u.username as owner_name, u.email as owner_email 
        FROM ajuan_donasi a 
        JOIN user u ON a.id_user_fk = u.id_user 
        WHERE a.status IN ('Pending', 'Rejected')
        ORDER BY a.created_at DESC";

$result = $db->query($sql);
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode(['success' => true, 'data' => $data]);