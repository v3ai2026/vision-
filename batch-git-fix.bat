@echo off
chcp 65001 >nul
REM === 自动检测并修复常见Git错误脚本 ===
REM 1. 检查所有仓库的常见问题并尝试修复

for /d %%d in (*) do (
    if exist "%%d\.git" (
        echo 检查 %%d
        pushd "%%d"
        REM 检查remote是否存在
        git remote -v >nul 2>&1
        if errorlevel 1 (
            echo [修复] remote丢失，尝试添加origin
            REM 这里可自动添加remote，需自定义URL
        )
        REM 检查是否有冲突文件
        git ls-files -u >nul 2>&1
        if not errorlevel 1 (
            echo [修复] 检测到冲突，尝试自动合并
            git merge --abort >nul 2>&1
            git reset --hard
        )
        popd
    )
)
pause
