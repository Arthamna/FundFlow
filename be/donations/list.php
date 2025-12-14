<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

$id_ajuan = $_GET['id_ajuan'] ?? null;
$limit = $_GET['limit'] ?? 100;

$db = Database::getInstance()->getConnection();

// Mengambil list donatur untuk sebuah campaign
$sql = "SELECT t.*, u.username 
        FROM transaksi_donasi t
        LEFT JOIN user u ON t.id_user_fk = u.id_user
        WHERE t.id_ajuan_fk = ?
        ORDER BY t.tanggal_donasi DESC LIMIT ?";

$stmt = $db->prepare($sql);
$stmt->bind_param('ii', $id_ajuan, $limit);
$stmt->execute();
$res = $stmt->get_result();

$donations = [];
while ($row = $res->fetch_assoc()) {
    // Jika anonymous, sembunyikan nama
    if ($row['anonymous'] == 1) {
        $row['username'] = 'Orang Baik';
    }
    $donations[] = $row;
}

echo json_encode(['success' => true, 'data' => $donations]);