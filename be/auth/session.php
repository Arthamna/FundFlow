<?php
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

ini_set('session.use_strict_mode', 1);
ini_set('session.use_only_cookies', 1);

session_name('FUNDFLOWSESSID');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',              // WAJIB '/'
    'domain' => '',             // localhost → kosong
    'secure' => $secure,        // false di http://localhost
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}