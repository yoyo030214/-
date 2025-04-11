Set WshShell = CreateObject("WScript.Shell")
strPath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
strCommand = "cmd.exe /c " & chr(34) & strPath & "start-service.bat" & chr(34)

WshShell.Run strCommand, 0, False

MsgBox "农业应用商家管理后台服务正在启动中...", 64, "服务启动" 