<?php
/**
 * Musica PHP API Shared Utilities & File System JSON Engine
 * Designed for InfinityFree & LAMP Shared Hosting environments.
 */

// Allow cross-origin and set JSON content type
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('DATA_DIR', __DIR__ . '/data');
define('ROOMS_DIR', DATA_DIR . '/rooms');
define('MESSAGES_DIR', DATA_DIR . '/messages');

// Ensure necessary data directories exist
if (!is_dir(DATA_DIR)) { @mkdir(DATA_DIR, 0755, true); }
if (!is_dir(ROOMS_DIR)) { @mkdir(ROOMS_DIR, 0755, true); }
if (!is_dir(MESSAGES_DIR)) { @mkdir(MESSAGES_DIR, 0755, true); }

/**
 * Clean up expired rooms older than 12 hours
 */
function cleanup_old_rooms() {
    $files = glob(ROOMS_DIR . '/*.json');
    if (!$files) return;
    $now = time();
    foreach ($files as $file) {
        if ($now - @filemtime($file) > 43200) { // 12 hours
            @unlink($file);
            $msg_file = MESSAGES_DIR . '/' . basename($file);
            if (file_exists($msg_file)) { @unlink($msg_file); }
        }
    }
}
cleanup_old_rooms();

/**
 * Helper to get JSON request payload
 */
function get_input() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}

/**
 * Return formatted JSON error response and stop execution
 */
function json_error($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit();
}

/**
 * Return success JSON payload
 */
function json_success($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit();
}

/**
 * Securely load a room by ID with file locking
 */
function get_room($room_id) {
    $clean_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $room_id);
    $path = ROOMS_DIR . '/' . $clean_id . '.json';
    if (!file_exists($path)) return null;
    $content = @file_get_contents($path);
    return json_decode($content, true);
}

/**
 * Securely save room state to atomic JSON file
 */
function save_room($room_id, $data) {
    $clean_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $room_id);
    $path = ROOMS_DIR . '/' . $clean_id . '.json';
    $data['updated_at'] = time();
    @file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * Append signaling or chat event to room messages queue
 */
function push_event($room_id, $type, $payload) {
    $clean_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $room_id);
    $path = MESSAGES_DIR . '/' . $clean_id . '.json';
    $events = [];
    if (file_exists($path)) {
        $content = @file_get_contents($path);
        $events = json_decode($content, true) ?: [];
    }
    
    // Append event with timestamp and ID
    $events[] = [
        'id' => uniqid('evt_', true),
        'timestamp' => time(),
        'type' => $type,
        'payload' => $payload
    ];

    // Keep only last 150 events to preserve memory and lightning-fast read speeds
    if (count($events) > 150) {
        $events = array_slice($events, -150);
    }

    @file_put_contents($path, json_encode($events, JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * Get events occurring after a given timestamp or event index
 */
function get_events($room_id, $after_timestamp = 0) {
    $clean_id = preg_replace('/[^a-zA-Z0-9_-]/', '', $room_id);
    $path = MESSAGES_DIR . '/' . $clean_id . '.json';
    if (!file_exists($path)) return [];
    $content = @file_get_contents($path);
    $all = json_decode($content, true) ?: [];
    if ($after_timestamp <= 0) return $all;
    
    $filtered = [];
    foreach ($all as $evt) {
        if ($evt['timestamp'] >= $after_timestamp) {
            $filtered[] = $evt;
        }
    }
    return $filtered;
}
