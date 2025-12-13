<?php
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        $host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? '127.0.0.1');
        $user = getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? 'root');
        $pass = getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? '');
        $db   = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? 'FundFlow');
        $port = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 3306);

        $this->conn = new mysqli($host, $user, $pass, $db, (int)$port);
        if ($this->conn->connect_errno) {
            error_log('MySQL connect error (' . $this->conn->connect_errno . '): ' . $this->conn->connect_error);
            $this->conn = null;
            return;
        }
        $this->conn->set_charset('utf8mb4');
    }

    // Singleton accessor
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // Dapatkan mysqli connection (atau null jika gagal)
    public function getConnection() {
        return $this->conn;
    }

    // Tutup koneksi ketika objek dihancurkan
    public function __destruct() {
        if ($this->conn instanceof mysqli) {
            $this->conn->close();
        }
    }
}
