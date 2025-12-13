<?php
// File: be/auth/register.php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Autoload & Database ---
require __DIR__ . '/../../vendor/autoload.php';
require __DIR__ . '/../Database.php';

if (class_exists('Dotenv\Dotenv')) {
    $dotenvPath = __DIR__ . '/../../';
    if (is_dir($dotenvPath)) {
        try {
            Dotenv\Dotenv::createImmutable($dotenvPath)->safeLoad();
        } catch (Exception $e) {
            // ignore
        }
    }
}

// Pastikan koneksi OK
$db = Database::getInstance()->getConnection();
if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}


// Ambil dan sanitasi input JSON
$data = json_decode(file_get_contents("php://input"), true);

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$username = isset($data['username']) ? trim($data['username']) : '';
$nama_lengkap = isset($data['nama_lengkap']) ? trim($data['nama_lengkap']) : $username;

// Basic validation
if (empty($email) || empty($password) || empty($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Semua field (email, username, password) wajib diisi.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid.']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 6 karakter.']);
    exit;
}

if (strlen($username) > 255 || strlen($email) > 255 || strlen($nama_lengkap) > 255) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Panjang field melebihi batas (255 karakter).']);
    exit;
}

// Cek duplicate email / username (satu query)
$checkSql = "SELECT id_user, email, username FROM `user` WHERE email = ? OR username = ? LIMIT 1";
if (!($stmt = $db->prepare($checkSql))) {
    error_log('Register prepare error (check): ' . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}
$stmt->bind_param('ss', $email, $username);
$stmt->execute();
$result = $stmt->get_result();
$existing = $result->fetch_assoc();
$stmt->close();

if ($existing) {
    // Tentukan apakah email atau username yang konflik
    if (isset($existing['email']) && $existing['email'] === $email) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar.']);
        exit;
    }
    if (isset($existing['username']) && $existing['username'] === $username) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username sudah digunakan.']);
        exit;
    }
    // fallback
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Akun sudah ada.']);
    exit;
}

// Simpan user baru
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

$insertSql = "INSERT INTO `user` (username, password_hash, nama_lengkap, email, role, created_at)
              VALUES (?, ?, ?, ?, 'user', NOW())";

if (!($insStmt = $db->prepare($insertSql))) {
    error_log('Register prepare error (insert): ' . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$insStmt->bind_param('ssss', $username, $hashed_password, $nama_lengkap, $email);

if (!$insStmt->execute()) {
    error_log('Register execute error: ' . $insStmt->error);
    if ($db->errno === 1062) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email atau username sudah terdaftar (konflik).']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error saat registrasi.']);
    }
    $insStmt->close();
    exit;
}

$newUserId = $insStmt->insert_id;
$insStmt->close();

// 5. Respons sukses
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Registrasi berhasil!',
    'user' => [
        'id' => (int)$newUserId,
        'username' => $username,
        'email' => $email,
        'role' => 'user'
    ]
]);
exit;
