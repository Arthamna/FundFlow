<?php
// File: FundFlow/be/auth/login.php

// PENTING: Untuk manajemen sesi
session_start();

// 1. Setup Header & CORS
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
// Penting: Izinkan header yang terkait dengan sesi/cookies jika Anda menggunakan kredensial
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); 

// Jika ini adalah preflight OPTIONS request, keluar
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Muat Autoload & Koneksi DB
// Path ke vendor/autoload.php (dua tingkat ke atas: auth -> be -> FundFlow)
require __DIR__ . '/../../vendor/autoload.php'; 
// Muat Kelas Database (Satu tingkat ke atas: auth -> be)
require '../Database.php'; 

use Dotenv\Dotenv;

// Muat .env
try {
    // Path ke root folder tempat .env berada (dua tingkat ke atas)
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../../'); 
    $dotenv->load();
    
    $db = Database::getInstance()->getConnection();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Error: Konfigurasi DB gagal.']);
    exit;
}

// 3. Ambil dan Validasi Data
$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Email dan password wajib diisi.']);
    exit;
}

// 4. Proses Login
try {
    // Cari user berdasarkan email
    $stmt = $db->prepare('SELECT id_user, password_hash, username, email, role FROM "user" WHERE email = :email');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Cek apakah user ditemukan
    if (!$user) {
        // Gunakan pesan generik untuk keamanan (tidak memberi tahu apakah email atau password yang salah)
        http_response_code(401); 
        echo json_encode(['success' => false, 'message' => 'Email atau password salah.']);
        exit;
    }

    // Verifikasi Password
    // Membandingkan password yang dimasukkan dengan hash yang tersimpan di DB
    if (password_verify($password, $user['password_hash'])) {
        
        // --- 5. Manajamen Sesi Sukses ---
        
        // Regenerasi ID sesi untuk mencegah Session Fixation Attack
        session_regenerate_id(true); 
        
        // Simpan data user ke sesi
        $_SESSION['user_id'] = $user['id_user'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role']; 
        
        // 6. Respons Sukses
        http_response_code(200); 
        echo json_encode([
            'success' => true, 
            'message' => 'Login berhasil!',
            'user' => [
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
        
    } else {
        // Password tidak cocok
        http_response_code(401); 
        echo json_encode(['success' => false, 'message' => 'Email atau password salah.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error saat login.']);
}

?>