
/**
 * GitHubService Unit Tests: Atomic SCM Orchestration
 * Validates the low-level Git Data API implementation for multi-file transactional commits.
 */

declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

const mockFetch = (responses: any[]) => {
  let callIndex = 0;
  (global as any).fetch = jest.fn().mockImplementation(() => {
    const currentResponse = responses[callIndex++] || { ok: true, json: () => Promise.resolve({}) };
    return Promise.resolve({
      ok: currentResponse.ok !== false,
      json: () => Promise.resolve(currentResponse.data),
      statusText: currentResponse.statusText || 'OK',
    });
  }) as any;
};

describe('GitHubService Atomic Protocol', () => {
  const TEST_TOKEN = 'ghp_atomic_mock_token';
  const { GitHubService } = require('./githubService');

  beforeEach(() => {
    jest.resetModules();
  });

  it('should initialize with a valid token', () => {
    const service = new GitHubService(TEST_TOKEN);
    expect(service).toBeDefined();
  });

  it('should provision a repository correctly', async () => {
    const service = new GitHubService(TEST_TOKEN);
    mockFetch([{ data: { name: 'new-project', owner: { login: 'agent' } } }]);

    const result = await service.provisionProject({
      name: 'new-project',
      description: 'AI Generated Project'
    });
    expect(result.name).toBe('new-project');
  });

  it('should perform an atomic multi-file push', async () => {
    const service = new GitHubService(TEST_TOKEN);
    
    // Mocking the sequence of Git Data API calls:
    // 1. Get Ref
    // 2. Get Commit (to get tree)
    // 3. Create Blob 1
    // 4. Create Blob 2
    // 5. Create Tree
    // 6. Create Commit
    // 7. Patch Ref
    mockFetch([
      { data: { object: { sha: 'last-commit-sha' } } },
      { data: { tree: { sha: 'base-tree-sha' } } },
      { data: { sha: 'blob-1-sha' } },
      { data: { sha: 'blob-2-sha' } },
      { data: { sha: 'new-tree-sha' } },
      { data: { sha: 'new-commit-sha' } },
      { data: { ref: 'refs/heads/main', object: { sha: 'new-commit-sha' } } }
    ]);

    const files = [
      { path: 'index.ts', content: 'console.log("hello")' },
      { path: 'styles.css', content: 'body { color: gold; }' }
    ];

    const result = await service.pushProjectFiles('owner', 'repo', files);
    expect(result.object.sha).toBe('new-commit-sha');
    expect((global as any).fetch).toHaveBeenCalledTimes(7);
  });

  it('should fail if the target branch does not exist during push', async () => {
    const service = new GitHubService(TEST_TOKEN);
    mockFetch([{ ok: false, statusText: 'Not Found' }]);

    await expect(service.pushProjectFiles('owner', 'repo', [{ path: 'x', content: 'y' }], 'missing-branch'))
      .rejects.toThrow('Branch missing-branch not found');
  });
});
