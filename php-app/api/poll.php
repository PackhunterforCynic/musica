<?php
require_once __DIR__ . '/utils.php';

$room_id = trim($_GET['room_id'] ?? $_POST['room_id'] ?? '');
$after_ts = intval($_GET['after'] ?? $_POST['after'] ?? 0);
$user_id = trim($_GET['user_id'] ?? $_POST['user_id'] ?? '');

if (empty($room_id)) {
    json_error('Room ID required.');
}

$room = get_room($room_id);
if (!$room) {
    // Return closed room status so client can handle gracefully
    json_success(['room_closed' => true, 'events' => []]);
}

// Fetch all events that occurred after client's last poll timestamp
$events = get_events($room_id, $after_ts);

// Filter out events sent by the requesting user themselves (except broadcasts)
$filtered_events = [];
foreach ($events as $e) {
    if (isset($e['payload']['sender_id']) && $e['payload']['sender_id'] === $user_id && !in_array($e['type'], ['ROOM_CREATED'])) {
        continue;
    }
    // If event has a targeted user_id (like an answer or ICE candidate), only deliver to target or host
    if (isset($e['payload']['target_id']) && $e['payload']['target_id'] !== $user_id) {
        continue;
    }
    $filtered_events[] = $e;
}

json_success([
    'room_closed' => false,
    'server_time' => time(),
    'participants' => array_values($room['participants'] ?? []),
    'locked' => $room['locked'],
    'events' => $filtered_events
]);
