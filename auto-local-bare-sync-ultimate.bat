@echo off
chcp 65001 >nul
REM 高级一键本地多项目裸仓库同步+定时备份+日志轮转+同步前检测脚本
REM 1. 支持自定义裸仓库根目录和 remote 名称
REM 2. 自动检测并同步所有分支，输出详细日志
REM 3. 自动 pull/push，支持增量同步
REM 4. 错误处理与结果统计
REM 5. 日志自动轮转，保留最近7份
REM 6. 同步前检测未提交更改，防止误覆盖
REM 7. 同步完成后自动备份裸仓库目录为zip包

set "bare_root=D:\my-git-remote"
set "remote_name=local"
set "log_file=sync_local_bare.log"
set "backup_dir=%bare_root%_backup"
set "max_logs=7"
if not exist "%bare_root%" mkdir "%bare_root%"
if not exist "%backup_dir%" mkdir "%backup_dir%"

REM 日志轮转
for /l %%i in (%max_logs%,-1,2) do if exist "%log_file%.%%i" ren "%log_file%.%%i" "%log_file%.%%i+1"
if exist "%log_file%" ren "%log_file%" "%log_file%.2"

set /a total=0
set /a success=0
set /a fail=0

for /d %%d in (*) do (
    if exist "%%d\.git" (
        set /a total+=1
        echo.>>%log_file%
        echo ========== 处理项目：%%d ==========>>%log_file%
        set "bare_repo=%bare_root%\%%d.git"
        if not exist "%bare_root%\%%d.git" (
            echo 创建裸仓库：%bare_root%\%%d.git>>%log_file%
            git init --bare "%bare_root%\%%d.git" >>%log_file% 2>&1
        )
        pushd "%%d"
        git remote | findstr /i "^%remote_name%$" >nul
        if errorlevel 1 (
            echo 添加 remote %remote_name%>>..\%log_file%
            git remote add %remote_name% "%bare_root%\%%d.git" >>..\%log_file% 2>&1
        ) else (
            echo remote %remote_name% 已存在>>..\%log_file%
        )
        REM 检查未提交更改
        git status --porcelain | findstr /r /v "^$" >nul
        if not errorlevel 1 (
            echo [警告] %%d 有未提交更改，已跳过同步>>..\%log_file%
            popd
            set /a fail+=1
            goto :continue
        )
        echo 拉取远程分支...>>..\%log_file%
        git fetch %remote_name% >>..\%log_file% 2>&1
        for /f "delims=" %%b in ('git branch --format="%%(refname:short)"') do (
            echo 同步分支 %%b ...>>..\%log_file%
            git pull %remote_name% %%b >>..\%log_file% 2>&1
            git push %remote_name% %%b >>..\%log_file% 2>&1
        )
        if errorlevel 1 (
            set /a fail+=1
            echo [失败] %%d>>..\%log_file%
        ) else (
            set /a success+=1
            echo [成功] %%d>>..\%log_file%
        )
        popd
        :continue
    )
)

REM 自动备份裸仓库目录为zip包
set "zipfile=%backup_dir%\bare_backup_%date:~0,10%_%time:~0,2%%time:~3,2%%time:~6,2%.zip"
powershell -Command "Compress-Archive -Path '%bare_root%\*' -DestinationPath '%zipfile%' -Force"

echo.
echo 总项目数：%total%  成功：%success%  失败：%fail%
echo 详细日志请查看 %log_file%
echo 裸仓库已自动备份到 %zipfile%
pause
