
/**
 * GitHub API Service: Enterprise-grade SCM Orchestration.
 * Handles repository lifecycle, file synchronization, and atomic project provisioning.
 * Utilizes the Git Data API for transactional multi-file updates.
 */
export class GitHubService {
  private baseUrl = 'https://api.github.com';

  constructor(private token: string) {
    if (!token) throw new Error("GitHub SCM Protocol requires a valid access token.");
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Safely encodes UTF-8 content to Base64.
   */
  private encodeContent(content: string): string {
    const bytes = new TextEncoder().encode(content);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async getGitignoreTemplates(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/gitignore/templates`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
  }

  async getLicenseTemplates(): Promise<{ key: string; name: string }[]> {
    const response = await fetch(`${this.baseUrl}/licenses`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
  }

  async getAuthenticatedUser() {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`User Fetch Error: ${response.statusText}`);
    return response.json();
  }

  /**
   * Provisions a new repository with optional standard templates.
   */
  async provisionProject(options: {
    name: string;
    description: string;
    isPrivate?: boolean;
    autoInitReadme?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  }) {
    const { name, description, isPrivate = true, autoInitReadme = true, gitignoreTemplate, licenseTemplate } = options;
    
    const repoResponse = await fetch(`${this.baseUrl}/user/repos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: autoInitReadme,
        gitignore_template: gitignoreTemplate,
        license_template: licenseTemplate,
      }),
    });

    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      throw new Error(`Provisioning Error: ${error.message || repoResponse.statusText}`);
    }

    return repoResponse.json();
  }

  /**
   * Atomic Multi-file Push using Git Data API.
   * This method pushes all files in a single commit.
   */
  async pushProjectFiles(owner: string, repo: string, files: { path: string; content: string }[], branch: string = 'main', message: string = '[IntelliBuild] Orchestrated Project Synchronization') {
    // 1. Get the latest commit SHA of the branch
    const refResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: this.getHeaders()
    });
    
    if (!refResponse.ok) {
      // If branch doesn't exist, we fallback to simple creation if possible or throw
      throw new Error(`Branch ${branch} not found. Ensure repository is initialized.`);
    }
    
    const refData = await refResponse.json();
    const lastCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the last commit
    const commitResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits/${lastCommitSha}`, {
      headers: this.getHeaders()
    });
    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create Blobs for each file
    const treeItems = await Promise.all(files.map(async (file) => {
      const blobResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          content: this.encodeContent(file.content),
          encoding: 'base64'
        })
      });
      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644', // Standard file mode
        type: 'blob',
        sha: blobData.sha
      };
    }));

    // 4. Create a new Tree
    const treeResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });
    const treeData = await treeResponse.json();
    const newTreeSha = treeData.sha;

    // 5. Create a new Commit
    const newCommitResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message,
        tree: newTreeSha,
        parents: [lastCommitSha]
      })
    });
    const newCommitData = await newCommitResponse.json();
    const newCommitSha = newCommitData.sha;

    // 6. Update the Reference
    const updateRefResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      })
    });

    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.json();
      throw new Error(`Atomic Sync Failed: ${error.message || updateRefResponse.statusText}`);
    }

    return updateRefResponse.json();
  }
}
