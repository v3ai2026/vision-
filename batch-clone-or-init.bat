@echo off
chcp 65001 >nul
REM === 批量克隆/新建项目脚本 ===
REM 1. 支持批量git clone指定仓库列表
REM 2. 支持自动初始化新仓库

REM === 配置区 ===
REM 仓库列表文件（每行一个git地址，支持https/ssh）
set "repo_list=repo-list.txt"
REM 新建本地仓库名列表（每行一个文件夹名）
set "new_repo_list=new-repo-list.txt"

REM === 批量克隆 ===
if exist "%repo_list%" (
    for /f "usebackq delims=" %%r in ("%repo_list%") do (
        echo 正在克隆 %%r
        git clone %%r
    )
)

REM === 批量新建本地仓库 ===
if exist "%new_repo_list%" (
    for /f "usebackq delims=" %%n in ("%new_repo_list%") do (
        if not exist "%%n" (
            mkdir "%%n"
            pushd "%%n"
            git init
            echo # %%n>README.md
            git add .
            git commit -m "init"
            popd
        )
    )
)

pause
