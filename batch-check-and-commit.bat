@echo off
chcp 65001 >nul
REM === 检查未提交变更并提醒/批量提交脚本 ===
REM 1. 检查所有仓库的未提交变更
REM 2. 可选一键批量add/commit

REM 自动提交信息
set "commit_msg=auto-commit by script"

for /d %%d in (*) do (
    if exist "%%d\.git" (
        pushd "%%d"
        git status --porcelain | findstr /r /v "^$" >nul
        if not errorlevel 1 (
            echo [提醒] %%d 有未提交变更
            git add .
            git commit -m "%commit_msg%"
        )
        popd
    )
)
pause
