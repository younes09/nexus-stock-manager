<?php
require_once 'config.php';

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['action']) && $data['action'] === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare('SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            
            sendResponse([
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'fullName' => $user['full_name'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            sendResponse(['error' => 'Invalid credentials'], 401);
        }
    }
}

// Check session
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare('SELECT id, email, full_name, role FROM users WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            sendResponse([
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'fullName' => $user['full_name'],
                    'role' => $user['role']
                ]
            ]);
        }
    }
    sendResponse(['user' => null]);
}

// Handle logout
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    session_destroy();
    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Invalid request'], 400);
?>
