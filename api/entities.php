<?php
require_once 'config.php';
require_once 'utils.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM entities ORDER BY name ASC');
        $entities = $stmt->fetchAll();
        sendResponse($entities);
        break;

    case 'POST':
        requireFields($data, ['id', 'name', 'type']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }
        
        $type = sanitizeString($data['type']);
        if (!in_array($type, ['client', 'supplier'])) {
             sendResponse(['error' => 'Invalid entity type'], 400);
             exit;
        }

        $stmt = $pdo->prepare('INSERT INTO entities (id, name, type, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)');
        try {
            $stmt->execute([
                $id,
                sanitizeString($data['name']),
                $type,
                empty($data['email']) ? null : sanitizeString($data['email']),
                empty($data['phone']) ? null : sanitizeString($data['phone']),
                empty($data['address']) ? null : sanitizeString($data['address'])
            ]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'PUT':
        requireFields($data, ['id', 'name', 'type']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $type = sanitizeString($data['type']);
        if (!in_array($type, ['client', 'supplier'])) {
             sendResponse(['error' => 'Invalid entity type'], 400);
             exit;
        }
        
        $stmt = $pdo->prepare('UPDATE entities SET name=?, type=?, email=?, phone=?, address=? WHERE id=?');
        try {
            $stmt->execute([
                sanitizeString($data['name']),
                $type,
                empty($data['email']) ? null : sanitizeString($data['email']),
                empty($data['phone']) ? null : sanitizeString($data['phone']),
                empty($data['address']) ? null : sanitizeString($data['address']),
                $id
            ]);
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

        $stmt = $pdo->prepare('DELETE FROM entities WHERE id = ?');
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
