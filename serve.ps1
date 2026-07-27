# =====================================================================
#  Local preview server for djoaniel-site-v2.
#
#  No runtime required. Uses a raw TcpListener rather than
#  System.Net.HttpListener on purpose: HttpListener needs a URL ACL
#  reservation, which means running the shell as administrator. A plain
#  socket on 127.0.0.1 needs nothing, so this just works.
#
#  Run it with serve.bat, or directly:
#    powershell -ExecutionPolicy Bypass -File serve.ps1
#
#  Stop with Ctrl+C.
# =====================================================================
param([int]$Port = 8000)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'
  '.css'='text/css; charset=utf-8';   '.js'='text/javascript; charset=utf-8'
  '.mjs'='text/javascript; charset=utf-8'
  '.json'='application/json; charset=utf-8'
  '.svg'='image/svg+xml';  '.png'='image/png'
  '.jpg'='image/jpeg';     '.jpeg'='image/jpeg'
  '.gif'='image/gif';      '.webp'='image/webp';  '.avif'='image/avif'
  '.ico'='image/x-icon'
  '.woff'='font/woff';     '.woff2'='font/woff2'; '.ttf'='font/ttf'
  '.txt'='text/plain; charset=utf-8'
  '.xml'='application/xml; charset=utf-8'
  '.webmanifest'='application/manifest+json'
  '.mp4'='video/mp4';      '.webm'='video/webm'
}

try {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "  Could not bind port $Port - something else is probably using it." -ForegroundColor Red
  Write-Host "  Try a different one:  .\serve.bat 8080" -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "  Serving " -NoNewline -ForegroundColor Green
Write-Host $root -ForegroundColor White
Write-Host "  at      " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pages:" -ForegroundColor DarkGray
foreach ($p in @('index.html','about.html','colophon.html',
                 'work/no-value.html','work/accessibility-lab.html','work/tessa.html',
                 'work/unhappy-path.html','work/sarisari-snaps.html')) {
  Write-Host "    http://localhost:$Port/$p" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

function Send-Response {
  param($stream, [int]$code, [string]$status, [string]$type, [byte[]]$body)
  $head  = "HTTP/1.1 $code $status`r`n"
  $head += "Content-Type: $type`r`n"
  $head += "Content-Length: $($body.Length)`r`n"
  # no caching, so a reload always shows the edit you just made
  $head += "Cache-Control: no-store, must-revalidate`r`n"
  $head += "Connection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($hb, 0, $hb.Length)
  if ($body.Length) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $client.ReceiveTimeout = 5000
    $client.SendTimeout    = 15000
    $stream = $client.GetStream()

    # --- read the request line (we only need the path) ---
    $buf = New-Object byte[] 8192
    $read = $stream.Read($buf, 0, $buf.Length)
    if ($read -le 0) { $client.Close(); continue }
    $req = [System.Text.Encoding]::ASCII.GetString($buf, 0, $read)
    $line = ($req -split "`r`n")[0]
    $parts = $line -split ' '
    if ($parts.Count -lt 2) { $client.Close(); continue }
    $method = $parts[0]
    $url    = $parts[1]

    # strip query and fragment, decode %20 and friends
    $path = ($url -split '[?#]')[0]
    $path = [System.Uri]::UnescapeDataString($path)
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }

    # --- resolve inside root, refuse anything that escapes it ---
    $rel  = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $full = [IO.Path]::GetFullPath((Join-Path $root $rel))
    $safe = $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)

    if ($safe -and (Test-Path -LiteralPath $full -PathType Container)) {
      $idx = Join-Path $full 'index.html'
      if (Test-Path -LiteralPath $idx -PathType Leaf) { $full = $idx }
    }

    if ($safe -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $ext  = [IO.Path]::GetExtension($full).ToLower()
      $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
      $body = [IO.File]::ReadAllBytes($full)
      Send-Response $stream 200 'OK' $type $body
      if ($method -eq 'GET') { Write-Host "  200  $path" -ForegroundColor DarkGray }
    } else {
      $msg  = [System.Text.Encoding]::UTF8.GetBytes("404 - not found: $path")
      Send-Response $stream 404 'Not Found' 'text/plain; charset=utf-8' $msg
      Write-Host "  404  $path" -ForegroundColor Yellow
    }
  } catch {
    # a browser hanging up mid-response is normal; keep serving
  } finally {
    if ($client) { try { $client.Close() } catch {} }
  }
}
