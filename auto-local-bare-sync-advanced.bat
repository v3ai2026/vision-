@echo off
chcp 65001 >nul
REM 高级一键本地多项目裸仓库同步脚本
REM 1. 支持自定义裸仓库根目录和 remote 名称
REM 2. 自动检测并同步所有分支，支持日志输出
REM 3. 可选自动 pull/push，支持增量同步
REM 4. 错误处理与结果统计

set "bare_root=D:\my-git-remote"
set "remote_name=local"
set "log_file=sync_local_bare.log"
if not exist "%bare_root%" mkdir "%bare_root%"
if exist "%log_file%" del "%log_file%"

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
    )
)
echo.
echo 总项目数：%total%  成功：%success%  失败：%fail%
echo 详细日志请查看 %log_file%

REM === 通知功能：同步完成后弹窗和声音提醒 ===
REM 弹窗通知
mshta "javascript:var sh=new ActiveXObject('WScript.Shell'); sh.Popup('本地裸仓库同步完成！\n总项目数：%total%  成功：%success%  失败：%fail%',5,'同步完成',64);close();"

REM === 多机同步功能 ===
REM 设置目标同步目录（如网络共享、NAS、U盘、OneDrive等）
set "sync_target=\\other-pc\git-backup"
REM 检查目标目录是否可访问
if exist "%sync_target%" (
    echo 正在同步裸仓库到多机目标：%sync_target%
    robocopy "%bare_root%" "%sync_target%" /MIR /FFT /Z /XA:H /W:5 /R:2 /LOG+:sync_local_bare.log
    echo 多机同步完成>>%log_file%
) else (
    echo [警告] 多机同步目标不可访问：%sync_target%>>%log_file%
)

REM === 备份清理功能 ===
REM 备份裸仓库目录到本地备份文件夹，并只保留最近3次
set "backup_dir=%bare_root%_backup"
if not exist "%backup_dir%" mkdir "%backup_dir%"
set "ts=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "ts=%ts: =0%"
set "backup_name=bare_%ts%"
echo 正在备份裸仓库到 %backup_dir%\%backup_name%>>%log_file%
xcopy "%bare_root%" "%backup_dir%\%backup_name%" /E /I /H /Y >nul
REM 清理只保留最近3个备份
for /f "skip=3 delims=" %%b in ('dir /b /ad /o-d "%backup_dir%"') do rd /s /q "%backup_dir%\%%b"
echo 备份完成，旧备份已清理>>%log_file%
REM 声音提醒
echo ^G
REM 也可用 powershell 播放系统提示音（可选）
REM powershell -c "[console]::beep(1000,500)"
pause
