<?php
// File: be/auth/login.php

require __DIR__ . '/session.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

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

// Load Database class
require __DIR__ . '/../Database.php';

$autoload = __DIR__ . '/../../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
    if (class_exists('Dotenv\Dotenv')) {
        try {
            Dotenv\Dotenv::createImmutable(__DIR__ . '/../../')->safeLoad();
        } catch (Exception $e) { }
    }
}

// Ambil koneksi mysqli
$dbInst = Database::getInstance();
$db = $dbInst->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error: cannot connect to database.']);
    exit;
}

// Ambil input JSON
$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi.']);
    exit;
}

// Prepare statement untuk menghindari SQL injection
$sql = "SELECT id_user, password_hash, username, email, role FROM `user` WHERE email = ? LIMIT 1";
if ($stmt = $db->prepare($sql)) {
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        // User tidak ditemukan
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email atau password salah.']);
        exit;
    }

    // Verifikasi password
    if (password_verify($password, $user['password_hash'])) {
        // Sukses: regenerate session id

        // echo json_encode([
        //     'session_id' => session_id(),
        //     'save_path' => session_save_path(),
        //     'session_data' => $_SESSION
        // ]);

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id_user'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];

        // Update last_login (optional)
        $updateSql = "UPDATE `user` SET last_login = NOW() WHERE id_user = ?";
        if ($upStmt = $db->prepare($updateSql)) {
            $upStmt->bind_param('i', $_SESSION['user_id']);
            $upStmt->execute();
            $upStmt->close();
        }

        session_write_close();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil!',
            'user' => [
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
        exit;
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email atau password salah.']);
        exit;
    }

} else {
    // gagal prepare
    error_log('MySQL prepare error: ' . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}