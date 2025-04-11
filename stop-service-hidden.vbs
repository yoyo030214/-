Set WshShell = CreateObject("WScript.Shell")
strPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
strCommand = "cmd.exe /c " & chr(34) & strPath & "stop-service.bat" & chr(34)

WshShell.Run strCommand, 0, False

MsgBox "农业应用商家管理后台服务正在停止中...", 64, "服务停止" 