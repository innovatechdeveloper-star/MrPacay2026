@echo off
echo Probando puerto 9100 en dispositivos...
echo.

echo [1] 192.168.15.2
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $result = $client.BeginConnect('192.168.15.2', 9100, $null, $null); $success = $result.AsyncWaitHandle.WaitOne(500, $false); if ($success) { Write-Host '    [IMPRESORA!]' -ForegroundColor Green }; $client.Close() } catch {}"

echo [2] 192.168.15.3
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $result = $client.BeginConnect('192.168.15.3', 9100, $null, $null); $success = $result.AsyncWaitHandle.WaitOne(500, $false); if ($success) { Write-Host '    [IMPRESORA!]' -ForegroundColor Green }; $client.Close() } catch {}"

echo [3] 192.168.15.20
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $result = $client.BeginConnect('192.168.15.20', 9100, $null, $null); $success = $result.AsyncWaitHandle.WaitOne(500, $false); if ($success) { Write-Host '    [IMPRESORA!]' -ForegroundColor Green }; $client.Close() } catch {}"

echo.
echo Probando ping...
echo.
ping 192.168.15.2 -n 1
ping 192.168.15.3 -n 1
echo.
pause
