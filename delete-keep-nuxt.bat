
powershell -File sync-all-git.ps1 > result.txt 2>&1@echo off
chcp 65001 >nul
REM 只保留指定的文件夹，其余全部删除

set "keep1=v3 公共模板"
set "keep2=33"
set "keep3=nuxt-ai-聊天机器人"
set "keep4=uiw2"
set "keep5=AG"

REM 保留所有以 nuxt 开头的文件夹

for /d %%d in (*) do (
    set "dname=%%d"
    setlocal enabledelayedexpansion
    echo !dname! | findstr /b /i "nuxt" >nul
    if !errorlevel! == 0 (
        endlocal & goto :continue
    )
    endlocal
    if /i not "%%d"=="%keep1%" if /i not "%%d"=="%keep2%" if /i not "%%d"=="%keep3%" if /i not "%%d"=="%keep4%" if /i not "%%d"=="%keep5%" (
        echo 正在删除：%%d
        rmdir /s /q "%%d"
    )
    :continue
)
echo.
echo 只保留指定的文件夹及所有以 nuxt 开头的文件夹，其余已全部删除！
pause
