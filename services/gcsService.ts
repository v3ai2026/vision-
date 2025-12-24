
import { GeneratedFile } from "../types";

/**
 * Google Cloud Storage API Service
 * Enterprise-grade orchestration for Cloud Storage operations.
 * Reference: https://cloud.google.com/storage/docs/json_api
 */
export class GCSService {
  private baseUrl = 'https://storage.googleapis.com/storage/v1';
  private uploadUrl = 'https://storage.googleapis.com/upload/storage/v1';

  constructor(private token: string) {
    if (!token) throw new Error("GCS Access Token (Bearer) is required for authentication.");
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List buckets for a specific project.
   */
  async listBuckets(projectId: string) {
    const response = await fetch(`${this.baseUrl}/b?project=${projectId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloud Storage List Buckets Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Create a new storage bucket.
   */
  async createBucket(projectId: string, bucketName: string, location: string = 'US') {
    const response = await fetch(`${this.baseUrl}/b?project=${projectId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: bucketName,
        location: location,
        storageClass: 'STANDARD',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bucket Creation Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * List objects in a bucket with optional prefix filtering.
   */
  async listObjects(bucket: string, prefix: string = '') {
    const url = `${this.baseUrl}/b/${bucket}/o?prefix=${encodeURIComponent(prefix)}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloud Storage Object Index Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Remove a specific object from the bucket.
   */
  async deleteObject(bucket: string, objectName: string) {
    const url = `${this.baseUrl}/b/${bucket}/o/${encodeURIComponent(objectName)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(`Asset Purge Error: ${error.error?.message || response.statusText}`);
    }

    return true;
  }

  /**
   * Upload a media blob as a storage object.
   */
  async uploadFile(bucket: string, path: string, content: string) {
    const url = `${this.uploadUrl}/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'text/plain',
      },
      body: content,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Asset Sync Error (${path}): ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Orchestrates a full project deployment to a storage bucket.
   */
  async uploadProject(bucket: string, files: GeneratedFile[], prefix: string = '') {
    const results = [];
    for (const file of files) {
      // Normalize paths to ensure they don't have leading slashes
      const cleanPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      const fullPath = prefix ? `${prefix}/${cleanPath}` : cleanPath;
      const res = await this.uploadFile(bucket, fullPath, file.content);
      results.push(res);
    }
    return results;
  }
}
