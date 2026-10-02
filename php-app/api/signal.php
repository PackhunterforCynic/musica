<?php
require_once __DIR__ . '/utils.php';

$input = get_input();
$room_id = trim($input['room_id'] ?? '');
$sender_id = trim($input['sender_id'] ?? '');
$event_type = trim($input['type'] ?? '');
$payload = $input['payload'] ?? [];

if (empty($room_id) || empty($event_type)) {
    json_error('Room ID and Event Type are required.');
}

$room = get_room($room_id);
if (!$room) {
    json_error('Room session expired or closed.', 404);
}

// Handle specialized state changes in atomic room file
if ($event_type === 'LOCK_ROOM' && $sender_id === $room['host_id']) {
    $room['locked'] = !empty($payload['locked']);
    save_room($room_id, $room);
}

if ($event_type === 'ADMIT_USER' && $sender_id === $room['host_id']) {
    $guest_id = $payload['user_id'] ?? '';
    $guest_name = $payload['name'] ?? 'Guest';
    if ($guest_id) {
        $p = [
            'id' => $guest_id,
            'name' => $guest_name,
            'role' => 'audience',
            'hand_raised' => false,
            'has_mic' => false,
            'joined_at' => time()
        ];
        $room['participants'][$guest_id] = $p;
        save_room($room_id, $room);
        push_event($room_id, 'PARTICIPANT_JOINED', ['participant' => $p]);
    }
}

if ($event_type === 'KICK_USER' && $sender_id === $room['host_id']) {
    $target_id = $payload['user_id'] ?? '';
    if ($target_id && isset($room['participants'][$target_id])) {
        unset($room['participants'][$target_id]);
        save_room($room_id, $room);
    }
}

if ($event_type === 'LEAVE_ROOM' || $event_type === 'END_ROOM') {
    if ($sender_id === $room['host_id'] || $event_type === 'END_ROOM') {
        // If host leaves or ends session, delete room entirely
        $path = ROOMS_DIR . '/' . $room_id . '.json';
        if (file_exists($path)) { @unlink($path); }
        push_event($room_id, 'ROOM_ENDED', ['reason' => 'Host terminated broadcast studio session.']);
        json_success(['status' => 'closed']);
    } else {
        if (isset($room['participants'][$sender_id])) {
            unset($room['participants'][$sender_id]);
            save_room($room_id, $room);
            push_event($room_id, 'PARTICIPANT_LEFT', ['user_id' => $sender_id]);
        }
    }
}

// Attach sender info to event and broadcast to room queue
$payload['sender_id'] = $sender_id;
push_event($room_id, $event_type, $payload);

json_success(['status' => 'sent']);
