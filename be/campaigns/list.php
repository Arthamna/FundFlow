<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

$db = Database::getInstance()->getConnection();

// Default: Ambil yang Verified (untuk landing page/dashboard umum)
// Jika ada parameter ?my=true, ambil milik user login (untuk dashboard user)
$onlyMy = isset($_GET['my']) && $_GET['my'] == 'true';
$status = $_GET['status'] ?? 'Verified';

$sql = "SELECT a.*, u.username as owner_name, u.email as owner_email 
        FROM ajuan_donasi a  
        JOIN user u ON a.id_user_fk = u.id_user ";


if ($onlyMy && isset($_SESSION['user_id'])) {
    $sql .= "WHERE a.id_user_fk = " . (int)$_SESSION['user_id'];
} else {
    // Public list hanya menampilkan Verified
    $sql .= "WHERE a.status = 'Verified'";
}

$sql .= " ORDER BY a.created_at DESC";

$result = $db->query($sql);
$campaigns = [];

while ($row = $result->fetch_assoc()) {
    $campaigns[] = $row;
}

echo json_encode(['success' => true, 'data' => $campaigns]);