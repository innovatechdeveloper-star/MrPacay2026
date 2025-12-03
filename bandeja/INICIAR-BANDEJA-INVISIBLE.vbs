' ====================================================================
' 🏷️ SISTEMA ETIQUETAS - LAUNCHER INVISIBLE (VBScript)
' ====================================================================
' Este script inicia la aplicación de bandeja COMPLETAMENTE INVISIBLE
' Sin ventanas, sin CMD, sin notificaciones - Ejecuta en segundo plano
' ====================================================================
'
' USO: Copiar a shell:startup o ejecutar directamente
'      Doble click → Aplicación inicia invisible
' ====================================================================

Option Explicit

' ⚠️ CAMBIAR ESTA RUTA A TU UBICACIÓN ⚠️
Dim PROJECT_DIR
PROJECT_DIR = "d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\bandeja"

' Crear objeto Shell
Dim WshShell, FSO
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Verificar que el directorio existe
If Not FSO.FileExists(PROJECT_DIR & "\main.js") Then
    WScript.Quit 1
End If

' Verificar que Node.js está instalado
On Error Resume Next
Dim nodeCheck
nodeCheck = WshShell.Run("cmd /c node --version", 0, True)
If Err.Number <> 0 Then
    WScript.Quit 1
End If
On Error Goto 0

' Verificar node_modules
If Not FSO.FolderExists(PROJECT_DIR & "\node_modules") Then
    ' Instalar dependencias en segundo plano (ventana oculta)
    WshShell.Run "cmd /c cd /d """ & PROJECT_DIR & """ && npm install", 0, False
    WScript.Sleep 3000
End If

' Iniciar aplicación Electron COMPLETAMENTE OCULTO
' Parámetro 0 = Ventana oculta
' Parámetro False = No esperar a que termine
WshShell.Run "cmd /c cd /d """ & PROJECT_DIR & """ && npm start", 0, False

' Limpiar objetos
Set WshShell = Nothing
Set FSO = Nothing

' Finalizar script (aplicación queda corriendo en segundo plano)
WScript.Quit 0
