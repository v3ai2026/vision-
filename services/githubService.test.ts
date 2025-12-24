
/**
 * GitHubService Unit Tests
 */
import { GitHubService } from './githubService';

declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

const mockFetch = (response: any, ok: boolean = true, status: number = 200) => {
  (window as any).fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
      statusText: ok ? 'OK' : 'Error',
    })
  ) as any;
};

describe('GitHubService Protocol', () => {
  const TEST_TOKEN = 'ghp_mock_token';

  beforeEach(() => {
    jest.resetModules();
  });

  it('should initialize with a valid token', () => {
    const service = new GitHubService(TEST_TOKEN);
    expect(service).toBeDefined();
  });

  it('should throw error if token is missing', () => {
    expect(() => new GitHubService('')).toThrow();
  });

  it('should provision a repository if it doesn\'t exist', async () => {
    const service = new GitHubService(TEST_TOKEN);
    
    // First call: get authenticated user
    // Second call: getRepository (returns 404)
    // Third call: provisionProject
    (window as any).fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ login: 'test-user' }) })
      .mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ name: 'test-repo', owner: { login: 'test-user' }, html_url: '...' }) });

    const result = await service.provisionProject('test-repo', 'Description');
    expect(result.name).toBe('test-repo');
    expect((window as any).fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle API errors gracefully during provisioning', async () => {
    const service = new GitHubService(TEST_TOKEN);
    (window as any).fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ login: 'test-user' }) })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 422, json: () => Promise.resolve({ message: 'Repo already exists' }) });

    await expect(service.provisionProject('test-repo', 'Desc'))
      .rejects.toThrow('Repo already exists');
  });
});
