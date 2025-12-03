Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """" & WScript.ScriptFullName & "\..\INICIAR-BANDEJA.bat""", 0, False
Set WshShell = Nothing
