@echo off
chcp 65001 >nul
REM 只保留指定的3个文件夹，其余全部删除

set "keep1=v3 公共模板"
set "keep2=33"
set "keep3=nuxt-ai-聊天机器人"

for /d %%d in (*) do (
    if /i not "%%d"=="%keep1%" if /i not "%%d"=="%keep2%" if /i not "%%d"=="%keep3%" (
        echo 正在删除：%%d
        rmdir /s /q "%%d"
    )
)
echo.
echo 只保留指定的3个文件夹，其余已全部删除！
pause
