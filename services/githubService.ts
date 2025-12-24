
/**
 * GitHub API Service: Enterprise-grade SCM Orchestration.
 * Handles repository lifecycle, atomic file synchronization, and project provisioning.
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

  private encodeContent(content: string): string {
    const bytes = new TextEncoder().encode(content);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
  }

  async getAuthenticatedUser() {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`User Fetch Error: ${response.statusText}`);
    return response.json();
  }

  async getRepository(owner: string, repo: string) {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Repo Fetch Error: ${response.statusText}`);
    return response.json();
  }

  async provisionProject(name: string, description: string, isPrivate: boolean = true) {
    const user = await this.getAuthenticatedUser();
    const existing = await this.getRepository(user.login, name);
    
    if (existing) {
      console.log(`[GitHub Service] Repository ${name} already exists. Returning existing.`);
      return existing;
    }

    console.log(`[GitHub Service] Provisioning new repository: ${name}`);
    const response = await fetch(`${this.baseUrl}/user/repos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true, // Creates initial commit with README
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Provisioning Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Performs an atomic commit of multiple files using the Git Data API.
   */
  async pushAtomicUpdate(owner: string, repo: string, files: { path: string; content: string }[], message: string = 'Update project shards') {
    // 1. Get the current branch reference (default to main)
    const refResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/main`, {
      headers: this.getHeaders(),
    });
    if (!refResponse.ok) throw new Error('Could not find main branch reference.');
    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA for the latest commit
    const commitResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
      headers: this.getHeaders(),
    });
    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for all files
    const treeEntries = await Promise.all(files.map(async (file) => {
      const blobResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          content: this.encodeContent(file.content),
          encoding: 'base64',
        }),
      });
      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644', // normal file
        type: 'blob',
        sha: blobData.sha,
      };
    }));

    // 4. Create a new tree
    const newTreeResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    });
    const newTreeData = await newTreeResponse.json();

    // 5. Create a new commit
    const newCommitResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message,
        tree: newTreeData.sha,
        parents: [latestCommitSha],
      }),
    });
    const newCommitData = await newCommitResponse.json();

    // 6. Update the reference
    const updateRefResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false,
      }),
    });

    if (!updateRefResponse.ok) throw new Error('Atomic update failed to update branch reference.');
    return updateRefResponse.json();
  }
}
