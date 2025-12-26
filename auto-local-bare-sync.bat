@echo off
chcp 65001 >nul
REM 一键批量为当前目录下所有项目创建本地裸仓库，并自动添加 remote，推送所有分支
REM 裸仓库统一放在 D:\my-git-remote\，remote 名为 local

set "bare_root=D:\my-git-remote"
if not exist "%bare_root%" mkdir "%bare_root%"

for /d %%d in (*) do (
    if exist "%%d\.git" (
        echo.
        echo ========== 处理项目：%%d ==========
        set "bare_repo=%bare_root%\%%d.git"
        if not exist "%bare_root%\%%d.git" (
            echo 创建裸仓库：%bare_root%\%%d.git
            git init --bare "%bare_root%\%%d.git"
        )
        pushd "%%d"
        git remote | findstr /i "^local$" >nul
        if errorlevel 1 (
            echo 添加 remote local
            git remote add local "%bare_root%\%%d.git"
        ) else (
            echo remote local 已存在
        )
        for /f "delims=" %%b in ('git branch --format="%%(refname:short)"') do (
            echo 推送分支 %%b 到 local
            git push local %%b
        )
        popd
    )
)
echo.
echo 所有本地项目已自动创建裸仓库并同步所有分支！
pause
