<?php
// fe/index.php
// Jika pengunjung ke '/', tampilkan landing-page.html.
// Untuk request ke static file lain, biarkan built-in server melayani file tersebut.

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// jika root -> tampilkan landing-page.html
if ($uri === '/' || $uri === '/index.php') {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/landing-page.html');
    exit;
}

// jika file statis ada, kembalikan false agar built-in server mengirimkannya
$requested = __DIR__ . $uri;
if (file_exists($requested) && is_file($requested)) {
    return false;
}

// fallback 404
http_response_code(404);
echo "404 Not Found";
