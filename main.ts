/**
 * WordPress Publisher for Obsidian
 * 
 * Publish Obsidian notes directly to WordPress as posts or pages.
 * 
 * @author Bill A. King
 * @version 1.0.0
 */

import { Plugin, TFile, Notice, TFolder, Menu } from 'obsidian';
import { WordPressClient, PublishResult, WPPost } from './src/wordpress-client';
import { WPPublisherSettings, WPPublisherSettingTab, DEFAULT_SETTINGS, WPSite } from './src/settings';
import { PublishModal } from './src/publish-modal';
import { markdownToHtml, extractContent, updateFrontmatter } from './src/markdown-converter';

export default class WPPublisherPlugin extends Plugin {
	settings: WPPublisherSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new WPPublisherSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('upload-cloud', 'Publish to WordPress', () => {
			this.publishCurrentNote();
		});

		// Add commands
		this.addCommand({
			id: 'publish-current-note',
			name: 'Publish current note to WordPress',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file && file.extension === 'md') {
					if (!checking) {
						this.publishCurrentNote();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'publish-note-quick',
			name: 'Quick publish (use defaults)',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file && file.extension === 'md') {
					if (!checking) {
						this.quickPublish();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'publish-multiple-notes',
			name: 'Publish selected notes',
			callback: () => {
				this.publishSelectedNotes();
			}
		});

		// Add context menu for files
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('Publish to WordPress')
							.setIcon('upload-cloud')
							.onClick(() => {
								this.publishFile(file);
							});
					});

					menu.addItem((item) => {
						item
							.setTitle('Quick publish to WordPress')
							.setIcon('zap')
							.onClick(() => {
								this.quickPublishFile(file);
							});
					});
				}

				// Folder context menu for bulk publish
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Publish all notes to WordPress')
							.setIcon('upload-cloud')
							.onClick(() => {
								this.publishFolder(file);
							});
					});
				}
			})
		);

		console.log('WordPress Publisher loaded');
	}

	onunload() {
		console.log('WordPress Publisher unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Publish the currently active note
	 */
	async publishCurrentNote() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice('No active note to publish');
			return;
		}

		await this.publishFile(file);
	}

	/**
	 * Open publish modal for a specific file
	 */
	async publishFile(file: TFile) {
		const content = await this.app.vault.read(file);
		const { content: bodyContent, frontmatter } = extractContent(content);

		new PublishModal(this.app, this, file, bodyContent, frontmatter).open();
	}

	/**
	 * Quick publish without modal (uses defaults/frontmatter)
	 */
	async quickPublish() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice('No active note to publish');
			return;
		}

		await this.quickPublishFile(file);
	}

	/**
	 * Quick publish a specific file
	 */
	async quickPublishFile(file: TFile) {
		if (this.settings.sites.length === 0) {
			new Notice('No WordPress sites configured. Please add a site in settings.');
			return;
		}

		const content = await this.app.vault.read(file);
		const { content: bodyContent, frontmatter } = extractContent(content);

		const defaultSite = this.settings.sites.find(s => s.isDefault) || this.settings.sites[0];

		const options = {
			site: defaultSite,
			postType: (frontmatter.wp_post_type as 'post' | 'page') || this.settings.defaultPostType,
			status: (frontmatter.wp_status as 'publish' | 'draft') || this.settings.defaultStatus,
			categories: (frontmatter.wp_categories as string[]) || [],
			tags: (frontmatter.wp_tags as string[]) || [],
			title: (frontmatter.wp_title as string) || file.basename,
			excerpt: (frontmatter.wp_excerpt as string) || '',
			slug: (frontmatter.wp_slug as string) || ''
		};

		const notice = new Notice('Publishing to WordPress...', 0);

		const result = await this.publishNote(file, bodyContent, frontmatter, options);

		notice.hide();

		if (result.success) {
			new Notice(`✓ Published: ${options.title}`);
		} else {
			new Notice(`✗ Failed: ${result.error}`);
		}
	}

	/**
	 * Publish multiple selected notes
	 */
	async publishSelectedNotes() {
		// Get selected files from file explorer
		const leaves = this.app.workspace.getLeavesOfType('file-explorer');
		if (leaves.length === 0) {
			new Notice('No files selected');
			return;
		}

		// This is a simplified approach - in practice you'd want to 
		// integrate with Obsidian's selection API more deeply
		new Notice('Use the folder context menu to publish multiple notes');
	}

	/**
	 * Publish all markdown files in a folder
	 */
	async publishFolder(folder: TFolder) {
		const files = folder.children.filter(
			(f): f is TFile => f instanceof TFile && f.extension === 'md'
		);

		if (files.length === 0) {
			new Notice('No markdown files in this folder');
			return;
		}

		const confirmed = await this.confirmBulkPublish(files.length);
		if (!confirmed) return;

		let successCount = 0;
		let failCount = 0;

		for (const file of files) {
			try {
				await this.quickPublishFile(file);
				successCount++;
			} catch {
				failCount++;
			}
		}

		new Notice(`Published ${successCount} notes, ${failCount} failed`);
	}

	/**
	 * Confirm bulk publish operation
	 */
	async confirmBulkPublish(count: number): Promise<boolean> {
		return new Promise((resolve) => {
			const notice = new Notice(`Publish ${count} notes to WordPress? Click to confirm.`, 10000);
			notice.noticeEl.onclick = () => {
				notice.hide();
				resolve(true);
			};
			setTimeout(() => resolve(false), 10000);
		});
	}

	/**
	 * Main publish logic
	 */
	async publishNote(
		file: TFile,
		content: string,
		frontmatter: Record<string, unknown>,
		options: {
			site: WPSite;
			postType: 'post' | 'page';
			status: 'publish' | 'draft' | 'pending' | 'private';
			categories: string[];
			tags: string[];
			title: string;
			excerpt: string;
			slug: string;
		}
	): Promise<PublishResult> {
		const client = new WordPressClient({
			siteUrl: options.site.url,
			username: options.site.username,
			applicationPassword: options.site.applicationPassword
		});

		// Convert markdown to HTML if enabled
		let htmlContent = content;
		if (this.settings.convertMarkdown) {
			htmlContent = markdownToHtml(content);
		}

		// Process categories and tags
		const categoryIds: number[] = [];
		const tagIds: number[] = [];

		if (options.postType === 'post') {
			for (const catName of options.categories) {
				try {
					const cat = await client.getOrCreateCategory(catName);
					categoryIds.push(cat.id);
				} catch (e) {
					console.error(`Failed to get/create category: ${catName}`, e);
				}
			}

			for (const tagName of options.tags) {
				try {
					const tag = await client.getOrCreateTag(tagName);
					tagIds.push(tag.id);
				} catch (e) {
					console.error(`Failed to get/create tag: ${tagName}`, e);
				}
			}
		}

		// Build post object
		const post: WPPost = {
			title: options.title,
			content: htmlContent,
			status: options.status,
			type: options.postType,
			categories: categoryIds.length > 0 ? categoryIds : undefined,
			tags: tagIds.length > 0 ? tagIds : undefined,
			excerpt: options.excerpt || undefined,
			slug: options.slug || undefined
		};

		// Check if updating existing post (must be a valid number > 0)
		const existingPostId = frontmatter.wp_post_id;
		const isValidPostId = typeof existingPostId === 'number' && existingPostId > 0;
		
		console.log('WP Publisher - Post ID check:', { existingPostId, isValidPostId, type: typeof existingPostId });
		
		let result: PublishResult;
		
		if (isValidPostId) {
			result = await client.updatePost(existingPostId, post);
		} else {
			result = await client.createPost(post);
		}

		// Update frontmatter if successful
		if (result.success && this.settings.addFrontmatterOnPublish) {
			const originalContent = await this.app.vault.read(file);
			const updatedContent = updateFrontmatter(originalContent, {
				wp_post_id: result.postId,
				wp_post_url: result.postUrl,
				wp_last_published: new Date().toISOString().split('T')[0]
			});
			await this.app.vault.modify(file, updatedContent);
		}

		return result;
	}
}
