<?php

/**
 * Validates if a given string is a valid UUIDv4
 */
function isValidUUID($uuid) {
    if (!is_string($uuid)) return false;
    return preg_match('/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i', $uuid) === 1;
}

/**
 * Sanitizes a string input to prevent XSS.
 * Removes HTML tags and encodes special characters.
 */
function sanitizeString($str) {
    if ($str === null || $str === '') return $str;
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

/**
 * Ensure a value is a float (for prices, costs, totals).
 */
function sanitizeFloat($val) {
    if ($val === null || $val === '') return 0.0;
    return (float) $val;
}

/**
 * Ensure a value is an integer (for quantities, stock).
 */
function sanitizeInt($val) {
    if ($val === null || $val === '') return 0;
    return (int) $val;
}

/**
 * Require a set of fields to be present in the payload.
 * Dies and sends a 400 error response if any are missing or empty.
 */
function requireFields($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $missing[] = $field;
        }
    }
    if (count($missing) > 0) {
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
        exit;
    }
}
?>
