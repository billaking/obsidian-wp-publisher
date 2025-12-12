/**
 * Settings Tab for WordPress Publisher
 */

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type WPPublisherPlugin from '../main';
import { WordPressClient } from './wordpress-client';

export interface WPSite {
	name: string;
	url: string;
	username: string;
	applicationPassword: string;
	isDefault: boolean;
}

export interface WPPublisherSettings {
	sites: WPSite[];
	defaultPostType: 'post' | 'page';
	defaultStatus: 'publish' | 'draft';
	convertMarkdown: boolean;
	addFrontmatterOnPublish: boolean;
	uploadImages: boolean;
}

export const DEFAULT_SETTINGS: WPPublisherSettings = {
	sites: [],
	defaultPostType: 'post',
	defaultStatus: 'draft',
	convertMarkdown: true,
	addFrontmatterOnPublish: true,
	uploadImages: true
};

export class WPPublisherSettingTab extends PluginSettingTab {
	plugin: WPPublisherPlugin;

	constructor(app: App, plugin: WPPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h1', { text: 'WordPress Publisher Settings' });

		// Sites Section
		containerEl.createEl('h2', { text: 'WordPress Sites' });
		containerEl.createEl('p', { 
			text: 'Add your WordPress sites. Use Application Passwords for authentication (Users → Profile → Application Passwords in WordPress).',
			cls: 'setting-item-description'
		});

		// Add site button
		new Setting(containerEl)
			.setName('Add WordPress Site')
			.setDesc('Configure a new WordPress site connection')
			.addButton(button => button
				.setButtonText('Add Site')
				.setCta()
				.onClick(() => {
					this.plugin.settings.sites.push({
						name: 'My WordPress Site',
						url: 'https://example.com',
						username: '',
						applicationPassword: '',
						isDefault: this.plugin.settings.sites.length === 0
					});
					this.plugin.saveSettings();
					this.display();
				}));

		// Display existing sites
		this.plugin.settings.sites.forEach((site, index) => {
			const siteContainer = containerEl.createDiv({ cls: 'wp-site-config' });
			siteContainer.createEl('h3', { text: `Site: ${site.name}` });

			new Setting(siteContainer)
				.setName('Site Name')
				.setDesc('A friendly name for this site')
				.addText(text => text
					.setPlaceholder('My Church Website')
					.setValue(site.name)
					.onChange(async (value) => {
						site.name = value;
						await this.plugin.saveSettings();
					}));

			new Setting(siteContainer)
				.setName('Site URL')
				.setDesc('Your WordPress site URL (e.g., https://www.mysite.com) - include www if your site uses it')
				.addText(text => text
					.setPlaceholder('https://www.example.com')
					.setValue(site.url)
					.onChange(async (value) => {
						site.url = value.replace(/\/$/, ''); // Remove trailing slash
						await this.plugin.saveSettings();
					}));

			new Setting(siteContainer)
				.setName('Username')
				.setDesc('Your WordPress username')
				.addText(text => text
					.setPlaceholder('admin')
					.setValue(site.username)
					.onChange(async (value) => {
						site.username = value;
						await this.plugin.saveSettings();
					}));

			new Setting(siteContainer)
				.setName('Application Password')
				.setDesc('Generate in WordPress: Users → Profile → Application Passwords')
				.addText(text => {
					text
						.setPlaceholder('xxxx xxxx xxxx xxxx xxxx xxxx')
						.setValue(site.applicationPassword)
						.onChange(async (value) => {
							site.applicationPassword = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.type = 'password';
				});

			new Setting(siteContainer)
				.setName('Default Site')
				.setDesc('Use this site by default when publishing')
				.addToggle(toggle => toggle
					.setValue(site.isDefault)
					.onChange(async (value) => {
						// Only one site can be default
						this.plugin.settings.sites.forEach(s => s.isDefault = false);
						site.isDefault = value;
						await this.plugin.saveSettings();
						this.display();
					}));

			// Test connection button
			new Setting(siteContainer)
				.setName('Test Connection')
				.addButton(button => button
					.setButtonText('Test')
					.onClick(async () => {
						button.setButtonText('Testing...');
						button.setDisabled(true);

						const client = new WordPressClient({
							siteUrl: site.url,
							username: site.username,
							applicationPassword: site.applicationPassword
						});

						const result = await client.testConnection();
						
						if (result.success) {
							new Notice(`✓ ${result.message}`);
						} else {
							new Notice(`✗ Connection failed: ${result.message}`);
						}

						button.setButtonText('Test');
						button.setDisabled(false);
					}))
				.addButton(button => button
					.setButtonText('Remove')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.sites.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					}));

			siteContainer.createEl('hr');
		});

		// Default Settings Section
		containerEl.createEl('h2', { text: 'Default Settings' });

		new Setting(containerEl)
			.setName('Default Post Type')
			.setDesc('Default content type when publishing')
			.addDropdown(dropdown => dropdown
				.addOption('post', 'Post')
				.addOption('page', 'Page')
				.setValue(this.plugin.settings.defaultPostType)
				.onChange(async (value: 'post' | 'page') => {
					this.plugin.settings.defaultPostType = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Status')
			.setDesc('Default publish status')
			.addDropdown(dropdown => dropdown
				.addOption('draft', 'Draft')
				.addOption('publish', 'Published')
				.setValue(this.plugin.settings.defaultStatus)
				.onChange(async (value: 'publish' | 'draft') => {
					this.plugin.settings.defaultStatus = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Convert Markdown to HTML')
			.setDesc('Convert Markdown syntax to HTML before publishing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.convertMarkdown)
				.onChange(async (value) => {
					this.plugin.settings.convertMarkdown = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Update Frontmatter')
			.setDesc('Add WordPress post ID and URL to note frontmatter after publishing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.addFrontmatterOnPublish)
				.onChange(async (value) => {
					this.plugin.settings.addFrontmatterOnPublish = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Upload Images')
			.setDesc('Upload embedded images to WordPress Media Library')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uploadImages)
				.onChange(async (value) => {
					this.plugin.settings.uploadImages = value;
					await this.plugin.saveSettings();
				}));

		// Help Section
		containerEl.createEl('h2', { text: 'Help' });
		containerEl.createEl('p', { text: 'Use frontmatter in your notes to control publishing:' });
		
		const codeBlock = containerEl.createEl('pre');
		codeBlock.createEl('code', { text: `---
wp_post_type: post  # or 'page'
wp_status: draft    # or 'publish', 'pending', 'private'
wp_categories:      # category names
  - Announcements
  - Events
wp_tags:            # tag names
  - sunday-service
  - 2025
wp_excerpt: "A short description..."
wp_slug: custom-url-slug
wp_post_id: 123     # Set automatically after first publish
wp_post_url: https://... # Set automatically after publish
---` });
	}
}
