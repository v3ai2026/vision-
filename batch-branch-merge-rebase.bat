@echo off
chcp 65001 >nul
REM === 批量切换分支/合并/rebase脚本 ===
REM 1. 对所有本地仓库批量切换分支、合并、rebase

REM 目标分支名
set "target_branch=main"
REM 合并来源分支（可选）
set "merge_from=dev"

for /d %%d in (*) do (
    if exist "%%d\.git" (
        echo 进入 %%d
        pushd "%%d"
        git fetch --all
        git checkout %target_branch%
        git pull
        REM 如需合并分支
        git merge %merge_from%
        REM 如需rebase
        REM git rebase %merge_from%
        popd
    )
)
pause
