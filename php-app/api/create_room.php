<?php
require_once __DIR__ . '/utils.php';

$input = get_input();
$host_name = trim($input['host_name'] ?? '');
$room_name = trim($input['room_name'] ?? 'Live Studio Broadcast');
$password = trim($input['password'] ?? '');
$waiting_room = !empty($input['waiting_room']);

if (empty($host_name)) {
    json_error('Host display name is required.');
}

// Generate unique clean Room ID
$characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
$room_id = '';
for ($i = 0; $i < 6; $i++) {
    $room_id .= $characters[rand(0, strlen($characters) - 1)];
}

$host_id = 'usr_' . uniqid();
$room = [
    'room_id' => $room_id,
    'room_name' => $room_name,
    'has_password' => !empty($password),
    'password_hash' => !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : null,
    'waiting_room_enabled' => $waiting_room,
    'locked' => false,
    'created_at' => time(),
    'host_id' => $host_id,
    'participants' => [
        $host_id => [
            'id' => $host_id,
            'name' => $host_name,
            'role' => 'host',
            'hand_raised' => false,
            'has_mic' => true,
            'joined_at' => time()
        ]
    ]
];

save_room($room_id, $room);
push_event($room_id, 'ROOM_CREATED', ['host_name' => $host_name, 'room_name' => $room_name]);

json_success([
    'room_id' => $room_id,
    'user_id' => $host_id,
    'role' => 'host',
    'room' => [
        'room_id' => $room_id,
        'room_name' => $room_name,
        'locked' => false,
        'waiting_room_enabled' => $waiting_room
    ],
    'participants' => array_values($room['participants'])
]);
