<?php
require_once 'config.php';
require_once 'utils.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM categories ORDER BY name ASC');
        $categories = $stmt->fetchAll();
        sendResponse($categories);
        break;

    case 'POST':
        requireFields($data, ['id', 'name']);
        
        $id = sanitizeString($data['id']);
        $name = sanitizeString($data['name']);
        
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
        try {
            $stmt->execute([$id, $name]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'PUT':
        requireFields($data, ['id', 'name']);
        
        $id = sanitizeString($data['id']);
        $name = sanitizeString($data['name']);

        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE categories SET name=? WHERE id=?');
        try {
            $stmt->execute([$name, $id]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'DELETE':
        $id = sanitizeString($_GET['id'] ?? '');
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
        try {
            $stmt->execute([$id]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}
?>
