<?php
// File: FundFlow/be/auth/register.php

// 1. Setup Header & CORS
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- KOREKSI: Gunakan Composer Autoload ---
// Path ke vendor/autoload.php (dua tingkat ke atas: be -> FundFlow)
require __DIR__ . '/../../vendor/autoload.php'; 
// Muat Kelas Database (Satu tingkat ke atas: auth -> be)
require '../Database.php'; 

use Dotenv\Dotenv;

// Muat .env (Tiga tingkat ke atas, ke root FundFlow)
try {
    // Path ke root folder tempat .env berada (dua tingkat ke atas: be/auth -> FundFlow)
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../../'); 
    $dotenv->load();
    
    // Inisiasi Koneksi DB
    $db = Database::getInstance()->getConnection();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Error (Config/DB): ' . $e->getMessage()]);
    exit;
}
// ... (Lanjutan kode Anda) ...

// 3. Ambil dan Validasi Data
$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$username = $data['username'] ?? '';
$nama_lengkap = $username; // Sederhanakan: nama_lengkap = username

if (empty($email) || empty($password) || empty($username)) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi.']);
    exit;
}

// 4. Proses Registrasi
try {
    // Cek apakah email sudah terdaftar
    $stmt_check = $db->prepare('SELECT id_user FROM "user" WHERE email = :email');
    $stmt_check->execute([':email' => $email]);
    if ($stmt_check->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar.']);
        exit;
    }

    // Hash Password sebelum disimpan (Wajib!)
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    
    // Masukkan data ke tabel "user"
    $stmt = $db->prepare('INSERT INTO "user" 
        (username, password_hash, nama_lengkap, email, role) 
        VALUES (:username, :pass_hash, :nama, :email, \'user\')');
    
    $stmt->execute([
        ':username' => $username,
        ':pass_hash' => $hashed_password,
        ':nama' => $nama_lengkap,
        ':email' => $email
    ]);

    // 5. Respons Sukses
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>