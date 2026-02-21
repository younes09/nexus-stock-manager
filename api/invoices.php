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
        
        $totalStmt = $pdo->query('SELECT COUNT(*) FROM invoices');
        $totalInvoices = (int)$totalStmt->fetchColumn();

        if ($limit) {
            $offset = ($page - 1) * $limit;
            $stmt = $pdo->prepare('SELECT * FROM invoices ORDER BY date DESC LIMIT :limit OFFSET :offset');
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
        } else {
             $stmt = $pdo->query('SELECT * FROM invoices ORDER BY date DESC');
        }
        
        $invoices = $stmt->fetchAll();
        
        // If no invoices, return early
        if (empty($invoices)) {
            sendResponse([
                'data' => [],
                'pagination' => [
                    'total' => 0,
                    'page' => $page,
                    'limit' => $limit,
                    'totalPages' => 0
                ]
            ]);
            exit;
        }

        // Get IDs to fetch items ONLY for these invoices
        $invoiceIds = array_column($invoices, 'id');
        $placeholders = str_repeat('?,', count($invoiceIds) - 1) . '?';
        
        $itemStmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id IN ($placeholders)");
        $itemStmt->execute($invoiceIds);
        $allItems = $itemStmt->fetchAll();
        
        // Group items by invoice_id
        $itemsByInvoice = [];
        foreach ($allItems as $item) {
            $itemsByInvoice[$item['invoice_id']][] = [
                'id' => $item['id'],
                'productId' => $item['product_id'],
                'productName' => $item['product_name'],
                'quantity' => $item['quantity'],
                'unitPrice' => $item['unit_price'],
                'total' => $item['total'],
                'cost' => $item['cost']
            ];
        }

        // Attach items to invoices and map JS names
        $resultData = array_map(function($inv) use ($itemsByInvoice) {
            return [
                'id' => $inv['id'],
                'number' => $inv['number'],
                'date' => $inv['date'],
                'type' => $inv['type'],
                'entityId' => $inv['entity_id'],
                'entityName' => $inv['entity_name'],
                'subtotal' => $inv['subtotal'],
                'total' => $inv['total'],
                'status' => $inv['status'],
                'paidAmount' => $inv['paid_amount'],
                'items' => $itemsByInvoice[$inv['id']] ?? []
            ];
        }, $invoices);

        sendResponse([
            'data' => $resultData,
            'pagination' => [
                'total' => $totalInvoices,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => $limit ? ceil($totalInvoices / $limit) : 1
            ]
        ]);
        break;

    case 'POST':
        try {
            requireFields($data, ['id', 'number', 'type', 'entityName', 'subtotal', 'total']);

            $id = sanitizeString($data['id']);
            if (!isValidUUID($id)) {
                sendResponse(['error' => 'Invalid ID format'], 400);
                exit;
            }

            $type = sanitizeString($data['type']);
            if (!in_array($type, ['sale', 'purchase'])) {
                sendResponse(['error' => 'Invalid invoice type'], 400);
                exit;
            }

            $pdo->beginTransaction();

            // Insert invoice header
            $stmt = $pdo->prepare('INSERT INTO invoices (id, number, type, entity_id, entity_name, subtotal, total, status, paid_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $id,
                sanitizeString($data['number']),
                $type,
                empty($data['entityId']) ? null : sanitizeString($data['entityId']),
                sanitizeString($data['entityName']),
                sanitizeFloat($data['subtotal']),
                sanitizeFloat($data['total']),
                empty($data['status']) ? 'paid' : sanitizeString($data['status']),
                sanitizeFloat($data['paidAmount'] ?? 0)
            ]);

            // Insert items and update stock
            $itemStmt = $pdo->prepare('INSERT INTO invoice_items (id, invoice_id, product_id, product_name, quantity, unit_price, total, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stockStmt = $pdo->prepare('UPDATE products SET stock = stock + ? WHERE id = ?');

            foreach ($data['items'] ?? [] as $item) {
                // Generate a random UUID for the item if not provided
                $itemId = empty($item['id']) ? vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4)) : sanitizeString($item['id']);
                
                $itemStmt->execute([
                    $itemId,
                    $id,
                    empty($item['productId']) ? null : sanitizeString($item['productId']),
                    sanitizeString($item['productName']),
                    sanitizeInt($item['quantity']),
                    sanitizeFloat($item['unitPrice']),
                    sanitizeFloat($item['total']),
                    empty($item['cost']) ? null : sanitizeFloat($item['cost'])
                ]);

                // Update stock logic (sale = decrease stock, purchase = increase stock)
                $qty = sanitizeInt($item['quantity']);
                $stockDelta = $type === 'sale' ? -$qty : $qty;
                if (!empty($item['productId'])) {
                    $stockStmt->execute([$stockDelta, sanitizeString($item['productId'])]);
                }
            }

            $pdo->commit();
            sendResponse(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'PUT':
        requireFields($data, ['id', 'number', 'type', 'entityName', 'subtotal', 'total']);

        $id = sanitizeString($data['id']);
        if (!isValidUUID($id)) {
            sendResponse(['error' => 'Invalid ID format'], 400);
            exit;
        }

        $type = sanitizeString($data['type']);
        if (!in_array($type, ['sale', 'purchase'])) {
            sendResponse(['error' => 'Invalid invoice type'], 400);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE invoices SET number=?, type=?, entity_id=?, entity_name=?, subtotal=?, total=?, status=?, paid_amount=? WHERE id=?');
        try {
            $stmt->execute([
                sanitizeString($data['number']),
                $type,
                empty($data['entityId']) ? null : sanitizeString($data['entityId']),
                sanitizeString($data['entityName']),
                sanitizeFloat($data['subtotal']),
                sanitizeFloat($data['total']),
                empty($data['status']) ? 'paid' : sanitizeString($data['status']),
                sanitizeFloat($data['paidAmount'] ?? 0),
                $id
            ]);
            sendResponse(['success' => true]);
        } catch (PDOException $e) {
            sendResponse(['error' => $e->getMessage()], 400);
        }
        break;

    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}
?>
