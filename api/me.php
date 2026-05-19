<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if(isset($_SESSION['user_id'])) {
    echo json_encode(array(
        "status" => "success",
        "data" => array(
            "id" => $_SESSION['user_id'],
            "nama" => $_SESSION['nama'],
            "username" => $_SESSION['username'],
            "role" => $_SESSION['role']
        )
    ));
} else {
    echo json_encode(array(
        "status" => "error",
        "message" => "Unauthorized"
    ));
}
?>
