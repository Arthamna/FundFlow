<?php

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? null);
        $dbName = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? null);
        $user = getenv('DB_USERNAME') ?: ($_ENV['DB_USERNAME'] ?? null);
        $password = getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? null);
        
        $dsn = "pgsql:host=$host;port=5432;dbname=$dbName;sslmode=require"; 
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, 
        ];

        try {
            $this->connection = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}