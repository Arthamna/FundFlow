<?php
// index.php (root)
// minimal router: frontend in /fe, backend in /be

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. root -> landing page
if ($uri === '/' || $uri === '/index.php') {
    readfile(__DIR__ . '/fe/landing-page.html');
    exit;
}

// 2. backend API: /be/...
if (strpos($uri, '/be/') === 0) {
    $file = __DIR__ . $uri;
    if (is_file($file)) {
        require $file;
        exit;
    }
}

// 3. static frontend files directly under /fe (assets, js, css)
$file = __DIR__ . '/fe' . $uri;
if (is_file($file)) {
    readfile($page);
    exit;
    // return false; // let PHP built-in server serve it
}

// 4. pages shortcut: /login.html -> /fe/pages/login.html
$page = __DIR__ . '/fe/pages' . $uri;
if (is_file($page)) {
    readfile($page);
    exit;
}

// 5. 404
http_response_code(404);
echo "404 Not Found";
