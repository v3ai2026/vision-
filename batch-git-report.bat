@echo off
chcp 65001 >nul
REM === 生成所有仓库状态HTML/Markdown报告脚本 ===
REM 1. 扫描所有仓库，输出分支、最后一次提交、未提交变更等信息
REM 2. 支持HTML和Markdown格式

set "report_md=repo-status-report.md"
set "report_html=repo-status-report.html"
if exist "%report_md%" del "%report_md%"
if exist "%report_html%" del "%report_html%"

echo | set /p=| 仓库 | 当前分支 | 最后提交 | 未提交变更 |>>%report_md%
echo |---|---|---|---|>>%report_md%
echo ^<html^>^<body^>^<table border=1^>^<tr^><th>仓库</th><th>当前分支</th><th>最后提交</th><th>未提交变更</th>^</tr^> >>%report_html%

for /d %%d in (*) do (
    if exist "%%d\.git" (
        pushd "%%d"
        for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set "branch=%%b"
        for /f "delims=" %%c in ('git log -1 --pretty=%%s') do set "last_commit=%%c"
        git status --porcelain | findstr /r /v "^$" >nul
        if not errorlevel 1 (
            set "dirty=是"
        ) else (
            set "dirty=否"
        )
        popd
        echo | %%d | !branch! | !last_commit! | !dirty! |>>%report_md%
        echo ^<tr^><td^>%%d^</td^><td^>!branch!^</td^><td^>!last_commit!^</td^><td^>!dirty!^</td^>^</tr^> >>%report_html%
    )
)
echo ^</table^>^</body^>^</html^> >>%report_html%

pause
