
/**
 * GitHubService Unit Tests
 * Targets logic consistency and error handling for SCM orchestration.
 */

// Explicitly declare Jest globals to satisfy TypeScript compiler in environments where types are not automatically loaded.
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Mock fetch for testing environment
const mockFetch = (response: any, ok: boolean = true) => {
  // Use a type cast on global to allow mocking the fetch API.
  (global as any).fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      statusText: ok ? 'OK' : 'Error',
    })
  ) as any;
};

describe('GitHubService Protocol', () => {
  const TEST_TOKEN = 'ghp_mock_token';
  const { GitHubService } = require('./githubService');

  beforeEach(() => {
    // Clear modules to ensure fresh state for each test
    jest.resetModules();
  });

  it('should initialize with a valid token', () => {
    const service = new GitHubService(TEST_TOKEN);
    expect(service).toBeDefined();
  });

  it('should throw error if token is missing', () => {
    expect(() => new GitHubService('')).toThrow();
  });

  it('should provision a repository correctly', async () => {
    const service = new GitHubService(TEST_TOKEN);
    
    // Mock repo creation response
    mockFetch({ name: 'test-repo', owner: { login: 'test-user' } });

    const result = await service.provisionProject('test-repo', 'Description');
    expect(result.name).toBe('test-repo');
    expect((global as any).fetch).toHaveBeenCalled();
  });

  it('should handle push file errors gracefully', async () => {
    const service = new GitHubService(TEST_TOKEN);
    mockFetch({ message: 'Validation Failed' }, false);

    await expect(service.pushFile('owner', 'repo', 'file.txt', 'data', 'msg'))
      .rejects.toThrow('Sync Error (file.txt): Validation Failed');
  });
});