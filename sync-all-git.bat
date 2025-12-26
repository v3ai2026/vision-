@echo off
chcp 65001 >nul
REM :量同步当前目录及所有子目录下的所有Git仓库

setlocal enabledelayedexpansion

for /d /r %%d in (.) do (
    if exist "%%d\.git" (
        echo.
        echo ========== 进入仓库：%%d ==========
        pushd "%%d"
        echo 拉取远程更新...
        git pull
        echo 推送本地修改...
        git add .
        git commit -am "sync: 本地自动同步" 2>nul
        git push
        popd
    )
)
echo.
echo 所有仓库同步完成！
pause
