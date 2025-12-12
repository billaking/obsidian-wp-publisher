/**
 * Publish Modal - UI for publishing notes to WordPress
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import type WPPublisherPlugin from '../main';
import { WordPressClient, WPCategory, WPTag } from './wordpress-client';
import { WPSite } from './settings';

interface PublishOptions {
	site: WPSite;
	postType: 'post' | 'page';
	status: 'publish' | 'draft' | 'pending' | 'private';
	categories: string[];
	tags: string[];
	title: string;
	excerpt: string;
	slug: string;
}

export class PublishModal extends Modal {
	plugin: WPPublisherPlugin;
	file: TFile;
	content: string;
	frontmatter: Record<string, unknown>;
	options: PublishOptions;
	availableCategories: WPCategory[] = [];
	availableTags: WPTag[] = [];
	isPublishing = false;

	constructor(app: App, plugin: WPPublisherPlugin, file: TFile, content: string, frontmatter: Record<string, unknown>) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.content = content;
		this.frontmatter = frontmatter;

		// Initialize options from frontmatter and defaults
		const defaultSite = plugin.settings.sites.find(s => s.isDefault) || plugin.settings.sites[0];
		
		this.options = {
			site: defaultSite,
			postType: (frontmatter.wp_post_type as 'post' | 'page') || plugin.settings.defaultPostType,
			status: (frontmatter.wp_status as 'publish' | 'draft') || plugin.settings.defaultStatus,
			categories: (frontmatter.wp_categories as string[]) || [],
			tags: (frontmatter.wp_tags as string[]) || [],
			title: (frontmatter.wp_title as string) || file.basename,
			excerpt: (frontmatter.wp_excerpt as string) || '',
			slug: (frontmatter.wp_slug as string) || ''
		};
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('wp-publisher-modal');

		contentEl.createEl('h2', { text: 'Publish to WordPress' });

		// Check if any sites configured
		if (this.plugin.settings.sites.length === 0) {
			contentEl.createEl('p', { 
				text: 'No WordPress sites configured. Please add a site in settings.',
				cls: 'wp-publisher-warning'
			});
			new Setting(contentEl)
				.addButton(btn => btn
					.setButtonText('Open Settings')
					.setCta()
					.onClick(() => {
						this.close();
						// Open plugin settings
						(this.app as App & { setting: { open: () => void; openTabById: (id: string) => void } }).setting.open();
					}));
			return;
		}

		// Existing post indicator
		const existingPostId = this.frontmatter.wp_post_id as number | undefined;
		if (existingPostId) {
			const existingNotice = contentEl.createDiv({ cls: 'wp-publisher-notice' });
			existingNotice.createEl('span', { text: `📝 Updating existing ${this.options.postType} #${existingPostId}` });
		}

		// Site selector
		if (this.plugin.settings.sites.length > 1) {
			new Setting(contentEl)
				.setName('WordPress Site')
				.addDropdown(dropdown => {
					this.plugin.settings.sites.forEach(site => {
						dropdown.addOption(site.url, site.name);
					});
					dropdown.setValue(this.options.site?.url || '');
					dropdown.onChange(value => {
						this.options.site = this.plugin.settings.sites.find(s => s.url === value)!;
						this.loadCategoriesAndTags();
					});
				});
		}

		// Title
		new Setting(contentEl)
			.setName('Title')
			.addText(text => text
				.setValue(this.options.title)
				.onChange(value => {
					this.options.title = value;
				}));

		// Post Type
		new Setting(contentEl)
			.setName('Post Type')
			.addDropdown(dropdown => dropdown
				.addOption('post', 'Post')
				.addOption('page', 'Page')
				.setValue(this.options.postType)
				.onChange((value: 'post' | 'page') => {
					this.options.postType = value;
					this.display();
				}));

		// Status
		new Setting(contentEl)
			.setName('Status')
			.addDropdown(dropdown => dropdown
				.addOption('draft', 'Draft')
				.addOption('publish', 'Published')
				.addOption('pending', 'Pending Review')
				.addOption('private', 'Private')
				.setValue(this.options.status)
				.onChange((value: 'publish' | 'draft' | 'pending' | 'private') => {
					this.options.status = value;
				}));

		// Categories (only for posts)
		if (this.options.postType === 'post') {
			new Setting(contentEl)
				.setName('Categories')
				.setDesc('Comma-separated category names')
				.addText(text => text
					.setPlaceholder('Announcements, Events')
					.setValue(this.options.categories.join(', '))
					.onChange(value => {
						this.options.categories = value.split(',').map(c => c.trim()).filter(c => c);
					}));

			// Tags
			new Setting(contentEl)
				.setName('Tags')
				.setDesc('Comma-separated tag names')
				.addText(text => text
					.setPlaceholder('sunday-service, 2025')
					.setValue(this.options.tags.join(', '))
					.onChange(value => {
						this.options.tags = value.split(',').map(t => t.trim()).filter(t => t);
					}));
		}

		// Excerpt
		new Setting(contentEl)
			.setName('Excerpt')
			.setDesc('Optional summary/description')
			.addTextArea(textarea => {
				textarea
					.setPlaceholder('A brief description of this content...')
					.setValue(this.options.excerpt)
					.onChange(value => {
						this.options.excerpt = value;
					});
				textarea.inputEl.rows = 3;
			});

		// Slug
		new Setting(contentEl)
			.setName('URL Slug')
			.setDesc('Custom URL slug (optional)')
			.addText(text => text
				.setPlaceholder('my-custom-url')
				.setValue(this.options.slug)
				.onChange(value => {
					this.options.slug = value;
				}));

		// Action buttons
		const buttonContainer = contentEl.createDiv({ cls: 'wp-publisher-buttons' });
		
		new Setting(buttonContainer)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()))
			.addButton(btn => btn
				.setButtonText(existingPostId ? 'Update' : 'Publish')
				.setCta()
				.onClick(() => this.publish()));
	}

	async loadCategoriesAndTags() {
		if (!this.options.site) return;

		try {
			const client = new WordPressClient({
				siteUrl: this.options.site.url,
				username: this.options.site.username,
				applicationPassword: this.options.site.applicationPassword
			});

			this.availableCategories = await client.getCategories();
			this.availableTags = await client.getTags();
		} catch (error) {
			console.error('Failed to load categories/tags:', error);
		}
	}

	async publish() {
		if (this.isPublishing) return;
		this.isPublishing = true;

		const notice = new Notice('Publishing to WordPress...', 0);

		try {
			const result = await this.plugin.publishNote(
				this.file,
				this.content,
				this.frontmatter,
				this.options
			);

			notice.hide();

			if (result.success) {
				new Notice(`✓ Published successfully! Post ID: ${result.postId}`);
				this.close();
			} else {
				new Notice(`✗ Failed to publish: ${result.error}`);
			}
		} catch (error) {
			notice.hide();
			new Notice(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		this.isPublishing = false;
	}

	display() {
		this.onOpen();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
