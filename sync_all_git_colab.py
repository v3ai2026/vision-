import os
import subprocess
from pathlib import Path

# 递归同步所有子目录下的 Git 仓库（拉取+推送）
# 适用于 Colab/Jupyter/Python 环境

def sync_all_git_repos(root_dir="."):
    log = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if ".git" in dirnames:
            repo_path = Path(dirpath)
            log.append(f"\n==== 仓库: {repo_path} ====")
            try:
                # 拉取远程
                result_pull = subprocess.run(["git", "pull"], cwd=repo_path, capture_output=True, text=True)
                log.append("拉取远程更新...\n" + result_pull.stdout + result_pull.stderr)
                # 推送本地
                subprocess.run(["git", "add", "."], cwd=repo_path)
                subprocess.run(["git", "commit", "-am", "sync: 本地自动同步"], cwd=repo_path)
                result_push = subprocess.run(["git", "push"], cwd=repo_path, capture_output=True, text=True)
                log.append("推送本地修改...\n" + result_push.stdout + result_push.stderr)
            except Exception as e:
                log.append(f"同步失败: {e}")
            # 不递归.git目录
            dirnames.remove(".git")
    return "\n".join(log)

# 运行同步（Colab中可直接运行）
if __name__ == "__main__":
    print(sync_all_git_repos("."))
