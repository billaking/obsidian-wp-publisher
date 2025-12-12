/**
 * WordPress REST API Client for Obsidian
 * Handles authentication and communication with WordPress sites
 */

import { requestUrl, RequestUrlParam } from 'obsidian';

export interface WPCredentials {
	siteUrl: string;
	username: string;
	applicationPassword: string;
}

export interface WPPost {
	id?: number;
	title: string;
	content: string;
	status: 'publish' | 'draft' | 'pending' | 'private';
	type: 'post' | 'page';
	categories?: number[];
	tags?: number[];
	featured_media?: number;
	excerpt?: string;
	slug?: string;
}

export interface WPCategory {
	id: number;
	name: string;
	slug: string;
	parent: number;
}

export interface WPTag {
	id: number;
	name: string;
	slug: string;
}

export interface WPMedia {
	id: number;
	source_url: string;
	title: { rendered: string };
}

export interface WPUser {
	id: number;
	name: string;
	slug: string;
}

export interface PublishResult {
	success: boolean;
	postId?: number;
	postUrl?: string;
	error?: string;
}

export class WordPressClient {
	private credentials: WPCredentials;
	private authHeader: string;

	constructor(credentials: WPCredentials) {
		this.credentials = credentials;
		// WordPress Application Passwords use Basic Auth
		this.authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.applicationPassword}`);
	}

	/**
	 * Get the base API URL
	 */
	private getApiUrl(endpoint: string): string {
		const baseUrl = this.credentials.siteUrl.replace(/\/$/, '');
		return `${baseUrl}/wp-json/wp/v2/${endpoint}`;
	}

	/**
	 * Make an authenticated request to WordPress
	 */
	private async request<T>(endpoint: string, options: Partial<RequestUrlParam> = {}): Promise<T> {
		const url = this.getApiUrl(endpoint);
		
		console.log('WP Publisher - Request:', {
			url,
			method: options.method || 'GET',
			body: options.body ? JSON.parse(options.body as string) : undefined
		});
		
		const requestOptions: RequestUrlParam = {
			url,
			method: options.method || 'GET',
			headers: {
				'Authorization': this.authHeader,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				...options.headers
			},
			throw: false
		};
		
		// Only add body for POST/PUT requests
		if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
			requestOptions.body = options.body;
			requestOptions.contentType = 'application/json';
		}
		
		const response = await requestUrl(requestOptions);

		console.log('WP Publisher - Response status:', response.status);
		console.log('WP Publisher - Response body:', response.json);
		
		if (response.status >= 400) {
			const errorData = response.json;
			console.error('WP Publisher - API Error:', {
				status: response.status,
				error: errorData
			});
			throw new Error(errorData?.message || `HTTP ${response.status}: Request failed`);
		}

		return response.json as T;
	}

	/**
	 * Test connection to WordPress site
	 */
	async testConnection(): Promise<{ success: boolean; message: string; user?: WPUser }> {
		try {
			const user = await this.request<WPUser>('users/me');
			return {
				success: true,
				message: `Connected as ${user.name}`,
				user
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Connection failed'
			};
		}
	}

	/**
	 * Get all categories
	 */
	async getCategories(): Promise<WPCategory[]> {
		return this.request<WPCategory[]>('categories?per_page=100');
	}

	/**
	 * Get all tags
	 */
	async getTags(): Promise<WPTag[]> {
		return this.request<WPTag[]>('tags?per_page=100');
	}

	/**
	 * Create or get a category by name
	 */
	async getOrCreateCategory(name: string): Promise<WPCategory> {
		const categories = await this.getCategories();
		const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
		
		if (existing) {
			return existing;
		}

		// Create new category
		return this.request<WPCategory>('categories', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	}

	/**
	 * Create or get a tag by name
	 */
	async getOrCreateTag(name: string): Promise<WPTag> {
		const tags = await this.getTags();
		const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
		
		if (existing) {
			return existing;
		}

		// Create new tag
		return this.request<WPTag>('tags', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	}

	/**
	 * Create a new post or page
	 */
	async createPost(post: WPPost): Promise<PublishResult> {
		try {
			const endpoint = post.type === 'page' ? 'pages' : 'posts';
			
			const requestBody = {
				title: post.title,
				content: post.content,
				status: post.status,
				categories: post.categories,
				tags: post.tags,
				featured_media: post.featured_media,
				excerpt: post.excerpt,
				slug: post.slug
			};
			
			console.log('WP Publisher - Creating post:', {
				endpoint,
				url: this.getApiUrl(endpoint),
				title: post.title,
				status: post.status,
				contentLength: post.content?.length
			});
			
			const result = await this.request<{ id: number; link: string }>(endpoint, {
				method: 'POST',
				body: JSON.stringify(requestBody)
			});

			console.log('WP Publisher - Response:', result);

			if (!result || !result.id) {
				console.error('WP Publisher - Invalid response:', result);
				return {
					success: false,
					error: 'WordPress returned an invalid response (no post ID)'
				};
			}

			return {
				success: true,
				postId: result.id,
				postUrl: result.link
			};
		} catch (error) {
			console.error('WP Publisher - Error creating post:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create post'
			};
		}
	}

	/**
	 * Update an existing post or page
	 */
	async updatePost(postId: number, post: WPPost): Promise<PublishResult> {
		try {
			const endpoint = post.type === 'page' ? `pages/${postId}` : `posts/${postId}`;
			
			const result = await this.request<{ id: number; link: string }>(endpoint, {
				method: 'PUT',
				body: JSON.stringify({
					title: post.title,
					content: post.content,
					status: post.status,
					categories: post.categories,
					tags: post.tags,
					featured_media: post.featured_media,
					excerpt: post.excerpt,
					slug: post.slug
				})
			});

			return {
				success: true,
				postId: result.id,
				postUrl: result.link
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to update post'
			};
		}
	}

	/**
	 * Upload media (image) to WordPress
	 */
	async uploadMedia(filename: string, data: ArrayBuffer, mimeType: string): Promise<WPMedia | null> {
		try {
			const url = this.getApiUrl('media');
			
			const response = await requestUrl({
				url,
				method: 'POST',
				headers: {
					'Authorization': this.authHeader,
					'Content-Type': mimeType,
					'Content-Disposition': `attachment; filename="${filename}"`
				},
				body: data,
				throw: false
			});

			if (response.status >= 400) {
				console.error('Media upload failed:', response.json);
				return null;
			}

			return response.json as WPMedia;
		} catch (error) {
			console.error('Media upload error:', error);
			return null;
		}
	}

	/**
	 * Get a post by ID
	 */
	async getPost(postId: number, type: 'post' | 'page' = 'post'): Promise<WPPost | null> {
		try {
			const endpoint = type === 'page' ? `pages/${postId}` : `posts/${postId}`;
			return this.request<WPPost>(endpoint);
		} catch {
			return null;
		}
	}
}
