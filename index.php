<?php /* Same page as index.html, but the parts are joined on the server. Needs PHP hosting. */ ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>XTeam</title>
<link rel="icon" id="fav" href="assets/logo.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,800;1,800&family=Barlow:wght@400;600&display=swap">
<link rel="stylesheet" href="css/style.css">
<link rel="apple-touch-icon" href="assets/logo.png"> <!-- iOS Apple Touch Icon -->
<link rel="shortcut icon" sizes="196x196" href="assets/logo.png"> <!-- Android / Chrome Shortcut Icon -->
</head>
<body>
<?php include 'partials/auth.html'; ?>
<?php include 'partials/header.html'; ?>
<?php include 'partials/sidebar.html'; ?>
<main id="main" tabindex="-1">
<?php include 'pages/dashboard.html'; ?>
<?php include 'pages/aifoodkcalhtml'; ?>
<?php include 'pages/messages.html'; ?>
<?php include 'pages/settings.html'; ?>
</main>
<?php include 'partials/footer.html'; ?>
<script src="js/app.js"></script>
</body>
</html>
