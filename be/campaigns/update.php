<?php
require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';
cors();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401); exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = $input['id_ajuan'] ?? 0;

if (!$id) {
    http_response_code(400); exit;
}

$db = Database::getInstance()->getConnection();

// Pastikan user adalah pemilik
$check = $db->prepare("SELECT id_user_fk, status FROM ajuan_donasi WHERE id_ajuan = ?");
$check->bind_param('i', $id);
$check->execute();
$res = $check->get_result()->fetch_assoc();

if (!$res || $res['id_user_fk'] != $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

// Logika: Jika user update, biasanya ini Banding (Appeal) atau Edit konten.
// Jika status rejected -> ubah ke pending (banding)
// Jika verified -> user tidak boleh ubah status, hanya konten.

$setClauses = [];
$types = "";
$params = [];

if (isset($input['judul'])) {
    $setClauses[] = "judul = ?";
    $types .= "s";
    $params[] = $input['judul'];
}
if (isset($input['deskripsi'])) {
    $setClauses[] = "deskripsi = ?";
    $types .= "s";
    $params[] = $input['deskripsi'];
}
// Handle Banding: User mengirim notes baru
if (isset($input['notes'])) {
    $setClauses[] = "catatan = ?";
    $types .= "s";
    $params[] = $input['notes'];
    
    // Otomatis ubah jadi Pending jika sedang Rejected
    if ($res['status'] === 'Rejected') {
        $setClauses[] = "status = 'Pending'";
    }
}

if (empty($setClauses)) {
    echo json_encode(['success' => true, 'message' => 'No changes']);
    exit;
}

$sql = "UPDATE ajuan_donasi SET " . implode(", ", $setClauses) . " WHERE id_ajuan = ?";
$types .= "i";
$params[] = $id;

$stmt = $db->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $db->error]);
}