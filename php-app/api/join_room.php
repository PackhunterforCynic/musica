<?php
require_once __DIR__ . '/utils.php';

$input = get_input();
$room_id = trim($input['room_id'] ?? '');
$user_name = trim($input['user_name'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($room_id) || empty($user_name)) {
    json_error('Room ID and Display Name are required.');
}

$room = get_room($room_id);
if (!$room) {
    json_error('Room not found. Please verify the Room ID and try again.', 404);
}

if ($room['locked']) {
    json_error('This room has been locked by the host against new admissions.', 403);
}

if ($room['has_password'] && !password_verify($password, $room['password_hash'])) {
    json_error('Incorrect room password.', 401);
}

$user_id = 'usr_' . uniqid();
$participant = [
    'id' => $user_id,
    'name' => $user_name,
    'role' => 'audience',
    'hand_raised' => false,
    'has_mic' => false,
    'joined_at' => time()
];

// If waiting room is enabled, send admission request event to host instead of immediate entry
if (!empty($room['waiting_room_enabled'])) {
    push_event($room_id, 'JOIN_REQUEST', [
        'user_id' => $user_id,
        'name' => $user_name,
        'timestamp' => time()
    ]);
    json_success([
        'status' => 'waiting_room',
        'room_id' => $room_id,
        'user_id' => $user_id,
        'room_name' => $room['room_name'],
        'host_name' => $room['participants'][$room['host_id']]['name'] ?? 'Host'
    ]);
}

$room['participants'][$user_id] = $participant;
save_room($room_id, $room);

// Notify existing participants via event stream
push_event($room_id, 'PARTICIPANT_JOINED', ['participant' => $participant]);

json_success([
    'status' => 'joined',
    'room_id' => $room_id,
    'user_id' => $user_id,
    'role' => 'audience',
    'room' => [
        'room_id' => $room_id,
        'room_name' => $room['room_name'],
        'locked' => $room['locked'],
        'waiting_room_enabled' => $room['waiting_room_enabled']
    ],
    'participants' => array_values($room['participants'])
]);
