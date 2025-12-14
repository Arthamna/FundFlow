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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id_ajuan = $input['id_ajuan_fk'] ?? 0;
$jumlah = $input['jumlah_donasi'] ?? 0;
$catatan = $input['catatan'] ?? '';
$anonymous = $input['anonymous'] ?? 0;

if ($id_ajuan <= 0 || $jumlah <= 0) {
    http_response_code(400); exit;
}

$db = Database::getInstance()->getConnection();

// Mulai Transaksi Database (PENTING untuk uang)
$db->begin_transaction();

try {
    // 1. Catat Transaksi
    $stmt1 = $db->prepare("INSERT INTO transaksi_donasi (id_ajuan_fk, id_user_fk, jumlah_donasi, catatan, tanggal_donasi) VALUES (?, ?, ?, ?, NOW())");
    $stmt1->bind_param('iids', $id_ajuan, $_SESSION['user_id'], $jumlah, $catatan);
    $stmt1->execute();
    
    // 2. Update Total di Tabel Ajuan
    $stmt2 = $db->prepare("UPDATE ajuan_donasi SET terkumpul_dana = terkumpul_dana + ? WHERE id_ajuan = ?");
    $stmt2->bind_param('di', $jumlah, $id_ajuan);
    $stmt2->execute();

    $db->commit();
    echo json_encode(['success' => true, 'message' => 'Donation success']);
} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Transaction failed']);
}