<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Function to decode Base64
function decodeBase64($str)
{
  return base64_decode($str);
}

// Configuration
$apiVersion = '4.79.0';
$username = 'id';
$password = 'mdp';
$userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0';

// Step 1: Retrieve GTK cookie
$gtkUrl = "https://api.ecoledirecte.com/v3/login.awp?gtk=1&v={$apiVersion}";

$gtkCh = curl_init($gtkUrl);
curl_setopt($gtkCh, CURLOPT_RETURNTRANSFER, true);
curl_setopt($gtkCh, CURLOPT_USERAGENT, $userAgent);
curl_setopt($gtkCh, CURLOPT_HEADER, true);
curl_setopt($gtkCh, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($gtkCh, CURLOPT_SSL_VERIFYHOST, false);

$gtkResponse = curl_exec($gtkCh);
if ($gtkResponse === false) {
  die('cURL Error (GTK): ' . curl_error($gtkCh));
}

$headerSize = curl_getinfo($gtkCh, CURLINFO_HEADER_SIZE);
$headerStr = substr($gtkResponse, 0, $headerSize);
$httpCode = curl_getinfo($gtkCh, CURLINFO_HTTP_CODE);
curl_close($gtkCh);

// Extract cookies
preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headerStr, $matches);
$setCookieHeaders = $matches[1];

$gtkValue = null;
$cookieString = '';

foreach ($setCookieHeaders as $cookiePart) {
  $cookieMain = explode(';', $cookiePart)[0];

  if (strpos($cookieMain, 'GTK=') === 0) {
    $gtkValue = substr($cookieMain, 4);
    $cookieString = $cookieMain;
  } else if (!empty($cookieString)) {
    $cookieString .= '; ' . $cookieMain;
  } else {
    $cookieString = $cookieMain;
  }
}

echo "GTK retrieved: " . substr($gtkValue, 0, 10) . "...\n\n";

// Step 2: Login attempt
$loginUrl = "https://api.ecoledirecte.com/v3/login.awp?v={$apiVersion}";
$loginData = [
  'identifiant' => $username,
  'motdepasse' => $password,
  'isReLogin' => false,
  'uuid' => '',
  'sesouvenirdemoi' => true
];

$postData = ['data' => json_encode($loginData, JSON_UNESCAPED_UNICODE)];
$postFields = http_build_query($postData);

$loginCh = curl_init($loginUrl);
curl_setopt($loginCh, CURLOPT_RETURNTRANSFER, true);
curl_setopt($loginCh, CURLOPT_USERAGENT, $userAgent);
curl_setopt($loginCh, CURLOPT_POST, true);
curl_setopt($loginCh, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($loginCh, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($loginCh, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($loginCh, CURLOPT_HTTPHEADER, [
  'Content-Type: application/x-www-form-urlencoded',
  'X-GTK: ' . $gtkValue,
  'Cookie: ' . $cookieString,
  'Accept: application/json, text/plain, */*',
  'Origin: https://www.ecoledirecte.com',
  'Referer: https://www.ecoledirecte.com/'
]);

$loginResponse = curl_exec($loginCh);
curl_close($loginCh);

$loginJson = json_decode($loginResponse, true);
echo "Response code: " . $loginJson['code'] . "\n";

// Step 3: Handle two-factor authentication if needed (code 250)
if ($loginJson && isset($loginJson['code']) && $loginJson['code'] === 250) {
  echo "Two-factor authentication required (QCM)\n";
  $token = $loginJson['token'];

  // Get QCM question
  $qcmUrl = "https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=get";

  // Important: create same data format as in TypeScript
  $qcmForm = ['data' => '{}']; // Empty JSON, without json_encode
  $qcmFields = http_build_query($qcmForm);

  $qcmCh = curl_init($qcmUrl);
  curl_setopt($qcmCh, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($qcmCh, CURLOPT_USERAGENT, $userAgent);
  curl_setopt($qcmCh, CURLOPT_POST, true); // Always POST
  curl_setopt($qcmCh, CURLOPT_POSTFIELDS, $qcmFields);
  curl_setopt($qcmCh, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($qcmCh, CURLOPT_SSL_VERIFYHOST, false);
  curl_setopt($qcmCh, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'X-GTK: ' . $gtkValue,
    'Cookie: ' . $cookieString,
    'X-Token: ' . $token
  ]);

  $qcmResponse = curl_exec($qcmCh);
  curl_close($qcmCh);

  $qcmJson = json_decode($qcmResponse, true);

  if ($qcmJson && isset($qcmJson['data'])) {
    // Decode question and options from Base64
    $questionBase64 = $qcmJson['data']['question'];
    $optionsBase64 = $qcmJson['data']['propositions'];

    $question = base64_decode($questionBase64);
    $options = array_map('base64_decode', $optionsBase64);

    echo "\n=== Verification Quiz ===\n";
    echo "Question: $question\n\n";
    echo "Options:\n";
    foreach ($options as $index => $option) {
      echo ($index + 1) . ". $option\n";
    }

    // Ask user to choose an answer
    echo "\nEnter the number of your choice (1-" . count($options) . "): ";
    $userChoice = trim(fgets(STDIN));
    $choiceIndex = intval($userChoice) - 1;

    if ($choiceIndex < 0 || $choiceIndex >= count($options)) {
      echo "Invalid choice, selecting the first option by default.\n";
      $choiceIndex = 0;
    }

    $choiceBase64 = $optionsBase64[$choiceIndex];
    echo "You chose: " . $options[$choiceIndex] . "\n";

    // Send QCM answer
    $answerUrl = "https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=post";
    $answerForm = ['data' => json_encode(['choix' => $choiceBase64], JSON_UNESCAPED_UNICODE)];
    $answerFields = http_build_query($answerForm);

    $answerCh = curl_init($answerUrl);
    curl_setopt($answerCh, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($answerCh, CURLOPT_USERAGENT, $userAgent);
    curl_setopt($answerCh, CURLOPT_POST, true);
    curl_setopt($answerCh, CURLOPT_POSTFIELDS, $answerFields);
    curl_setopt($answerCh, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($answerCh, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($answerCh, CURLOPT_HTTPHEADER, [
      'Content-Type: application/x-www-form-urlencoded',
      'X-GTK: ' . $gtkValue,
      'Cookie: ' . $cookieString,
      'X-Token: ' . $token
    ]);

    $answerResponse = curl_exec($answerCh);
    curl_close($answerCh);

    $answerJson = json_decode($answerResponse, true);

    if ($answerJson && isset($answerJson['data']['cn']) && isset($answerJson['data']['cv'])) {
      echo "Answer validated successfully\n";

      // Get cn and cv values
      $cn = $answerJson['data']['cn'];
      $cv = $answerJson['data']['cv'];

      // Get a new GTK
      $newGtk = getGTK($userAgent, $apiVersion);

      // Final login with cn and cv values
      $finalLoginData = [
        'identifiant' => $username,
        'motdepasse' => $password,
        'isReLogin' => false,
        'uuid' => '',
        'sesouvenirdemoi' => true,
        'fa' => [['cn' => $cn, 'cv' => $cv]]
      ];

      $finalPostData = ['data' => json_encode($finalLoginData, JSON_UNESCAPED_UNICODE)];
      $finalPostFields = http_build_query($finalPostData);

      $finalLoginCh = curl_init($loginUrl);
      curl_setopt($finalLoginCh, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($finalLoginCh, CURLOPT_USERAGENT, $userAgent);
      curl_setopt($finalLoginCh, CURLOPT_POST, true);
      curl_setopt($finalLoginCh, CURLOPT_POSTFIELDS, $finalPostFields);
      curl_setopt($finalLoginCh, CURLOPT_SSL_VERIFYPEER, false);
      curl_setopt($finalLoginCh, CURLOPT_SSL_VERIFYHOST, false);
      curl_setopt($finalLoginCh, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        'X-GTK: ' . $newGtk['gtk'],
        'Cookie: ' . $newGtk['cookieString']
      ]);

      $finalLoginResponse = curl_exec($finalLoginCh);
      curl_close($finalLoginCh);

      $finalLoginJson = json_decode($finalLoginResponse, true);

      if ($finalLoginJson && $finalLoginJson['code'] === 200) {
        echo "\n✅ Login successful!\n";
        echo "Token: " . substr($finalLoginJson['token'], 0, 20) . "...\n";

        if (isset($finalLoginJson['data']['accounts']) && count($finalLoginJson['data']['accounts']) > 0) {
          echo "Accounts found: " . count($finalLoginJson['data']['accounts']) . "\n";
        }
      } else {
        echo "\n❌ Final login failed: " . ($finalLoginJson['message'] ?? "unknown error") . "\n";
      }
    } else {
      echo "Failed to validate QCM answer\n";
    }
  } else {
    echo "Error retrieving QCM\n";
    if (isset($qcmJson['message'])) {
      echo "Message: " . $qcmJson['message'] . "\n";
    }
  }
} else if (isset($loginJson['code']) && $loginJson['code'] === 200) {
  echo "✅ Login successful without QCM!\n";
  echo "Token: " . substr($loginJson['token'], 0, 20) . "...\n";
} else {
  echo "❌ Login failed: " . ($loginJson['message'] ?? "unknown error") . "\n";
}

// Function to get GTK
function getGTK($userAgent, $apiVersion)
{
  $gtkUrl = "https://api.ecoledirecte.com/v3/login.awp?gtk=1&v={$apiVersion}";

  $ch = curl_init($gtkUrl);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
  curl_setopt($ch, CURLOPT_HEADER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

  $response = curl_exec($ch);
  $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $headerStr = substr($response, 0, $headerSize);
  curl_close($ch);

  preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headerStr, $matches);
  $cookies = $matches[1];

  $gtkValue = null;
  $cookieString = '';

  foreach ($cookies as $cookiePart) {
    $cookieMain = explode(';', $cookiePart)[0];

    if (strpos($cookieMain, 'GTK=') === 0) {
      $gtkValue = substr($cookieMain, 4);
      $cookieString = $cookieMain;
    } else if (!empty($cookieString)) {
      $cookieString .= '; ' . $cookieMain;
    } else {
      $cookieString = $cookieMain;
    }
  }

  return [
    'gtk' => $gtkValue,
    'cookieString' => $cookieString
  ];
}
