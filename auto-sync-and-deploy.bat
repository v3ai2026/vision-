@echo off
chcp 65001 >nul
REM 自动递归同步所有Git仓库并推送到远程，Vercel自动部署

for /d %%d in (*) do (
    if exist "%%d\.git" (
        echo.
        echo ========== 进入仓库：%%d ==========
        pushd "%%d"
        echo 拉取远程更新...
        git pull
        echo 推送本地修改...
        git add .
        git commit -am "自动部署：本地自动同步" 2>nul
        git push
        popd
    )
)
echo.
echo 所有仓库已自动同步并推送，Vercel 将自动部署！
pause
