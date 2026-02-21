<?php
require_once 'config.php';
require_once 'utils.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM products ORDER BY name ASC');
        $products = $stmt->fetchAll();
        sendResponse($products);
        break;

    case 'POST':
        requireFields($data, ['id', 'name', 'sku', 'category', 'price', 'cost']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO products (id, name, sku, category, price, cost, stock, min_stock, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        try {
            $stmt->execute([
                $id,
                sanitizeString($data['name']),
                sanitizeString($data['sku']),
                sanitizeString($data['category']),
                sanitizeFloat($data['price']),
                sanitizeFloat($data['cost']),
                sanitizeInt($data['stock']),
                sanitizeInt($data['minStock']),
                empty($data['expiryDate']) ? null : sanitizeString($data['expiryDate'])
            ]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'PUT':
        requireFields($data, ['id', 'name', 'sku', 'category', 'price', 'cost']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE products SET name=?, sku=?, category=?, price=?, cost=?, stock=?, min_stock=?, expiry_date=? WHERE id=?');
        try {
            $stmt->execute([
                sanitizeString($data['name']),
                sanitizeString($data['sku']),
                sanitizeString($data['category']),
                sanitizeFloat($data['price']),
                sanitizeFloat($data['cost']),
                sanitizeInt($data['stock']),
                sanitizeInt($data['minStock']),
                empty($data['expiryDate']) ? null : sanitizeString($data['expiryDate']),
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

        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
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
