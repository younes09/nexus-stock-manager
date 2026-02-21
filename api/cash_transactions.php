<?php
require_once 'config.php';
require_once 'utils.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : null;
        
        $totalStmt = $pdo->query('SELECT COUNT(*) FROM cash_transactions');
        $totalTransactions = (int)$totalStmt->fetchColumn();

        if ($limit) {
            $offset = ($page - 1) * $limit;
            $stmt = $pdo->prepare('SELECT * FROM cash_transactions ORDER BY date DESC LIMIT :limit OFFSET :offset');
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
        } else {
             $stmt = $pdo->query('SELECT * FROM cash_transactions ORDER BY date DESC');
        }

        $transactions = $stmt->fetchAll();
        
        sendResponse([
            'data' => $transactions,
            'pagination' => [
                'total' => $totalTransactions,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => $limit ? ceil($totalTransactions / $limit) : 1
            ]
        ]);
        break;

    case 'POST':
        requireFields($data, ['id', 'description', 'amount', 'type', 'category']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $type = sanitizeString($data['type']);
        if (!in_array($type, ['income', 'expense'])) {
            sendResponse(['error' => 'Invalid transaction type'], 400);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO cash_transactions (id, date, description, amount, type, category) VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?)');
        try {
            $stmt->execute([
                $id,
                empty($data['date']) ? null : sanitizeString($data['date']),
                sanitizeString($data['description']),
                sanitizeFloat($data['amount']),
                $type,
                sanitizeString($data['category'])
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

        $stmt = $pdo->prepare('DELETE FROM cash_transactions WHERE id = ?');
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
