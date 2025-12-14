<?php
// File: be/campaigns/create.php

require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../Database.php';

// CORS headers (sama seperti login.php)
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

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Ambil data dari POST
$judul = $_POST['judul'] ?? '';
$deskripsi = $_POST['deskripsi'] ?? '';
$target = $_POST['target_dana'] ?? 0;

// Validasi input
if (empty($judul) || empty($deskripsi) || $target <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input data']);
    exit;
}

// Validasi file upload
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Gambar wajib diupload']);
    exit;
}

$file = $_FILES['image'];

// Validasi tipe file
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipe file harus gambar (JPG, PNG, GIF, WEBP)']);
    exit;
}

// Validasi ukuran file (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ukuran file maksimal 5MB']);
    exit;
}

// Buat folder uploads jika belum ada
$uploadDir = __DIR__ . '/../../fe/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal membuat folder upload']);
        exit;
    }
}

// Generate nama file unik
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = uniqid('campaign_', true) . '.' . $extension;
$targetPath = $uploadDir . $fileName;

// Upload file
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal mengupload file']);
    exit;
}

// Simpan path relatif ke database
$imagePath = 'uploads/' . $fileName;

// Ambil koneksi database
$dbInst = Database::getInstance();
$db = $dbInst->getConnection();

if (!$db) {
    // Hapus file jika koneksi database gagal
    unlink($targetPath);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error: cannot connect to database.']);
    exit;
}

// Insert ke database
$sql = "INSERT INTO ajuan_donasi (id_user_fk, judul, deskripsi, target_dana, status, image_path) 
        VALUES (?, ?, ?, ?, 'Pending', ?)";
        
if ($stmt = $db->prepare($sql)) {
    $userId = $_SESSION['user_id'];
    $stmt->bind_param('issds', $userId, $judul, $deskripsi, $target, $imagePath);
    
    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        $stmt->close();
        
        http_response_code(200);
        echo json_encode([
            'success' => true, 
            'message' => 'Campaign created successfully',
            'data' => [
                'id_ajuan' => $newId,
                'judul' => $judul,
                'status' => 'Pending',
                'image_path' => $imagePath
            ]
        ]);
    } else {
        // Hapus file jika gagal insert ke database
        unlink($targetPath);
        $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $db->error]);
    }
} else {
    // Hapus file jika gagal prepare
    unlink($targetPath);
    error_log('MySQL prepare error: ' . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
}
?>