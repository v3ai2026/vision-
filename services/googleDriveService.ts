
import { GeneratedFile } from "../types";

/**
 * Google Drive API Service
 * Reference: https://developers.google.com/drive/api/v3/reference
 */
export class GoogleDriveService {
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private uploadUrl = 'https://www.googleapis.com/upload/drive/v3';

  constructor(private token: string) {
    if (!token) throw new Error("Google Access Token is required for Drive operations.");
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List folders in Drive.
   */
  async listFolders(query: string = "mimeType = 'application/vnd.google-apps.folder'") {
    const response = await fetch(`${this.baseUrl}/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Drive List Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Create a folder in Drive.
   */
  async createFolder(name: string, parentId?: string) {
    const body: any = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) body.parents = [parentId];

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Folder Creation Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload a file to Drive.
   */
  async uploadFile(name: string, content: string, parentId?: string) {
    // Simple multipart-like or two-step upload
    // For simplicity, using the 'multipart' upload protocol to send metadata + content
    const metadata = {
      name: name,
      parents: parentId ? [parentId] : [],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain\r\n\r\n' +
      content +
      close_delim;

    const response = await fetch(`${this.uploadUrl}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Drive Upload Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sync a whole project to a Drive folder.
   */
  async syncProject(projectName: string, files: GeneratedFile[], parentId?: string) {
    // 1. Create root folder for project
    const projectFolder = await this.createFolder(projectName, parentId);
    
    const results = [];
    for (const file of files) {
      // In Drive, we might want to mirror folder structure, 
      // but for a basic sync we can just upload with paths as names or resolve nested folders.
      // Let's keep it simple and upload to the flat project folder for now.
      const res = await this.uploadFile(file.path, file.content, projectFolder.id);
      results.push(res);
    }
    return results;
  }
}
