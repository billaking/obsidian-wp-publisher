# Changelog

All notable changes to the WordPress Publisher plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-12

### Added
- Initial release of WordPress Publisher for Obsidian
- Publish Obsidian notes directly to WordPress as posts or pages
- Support for multiple WordPress sites
- Application Password authentication (secure, no main password needed)
- Publish modal with full control over post settings:
  - Title
  - Post type (post/page)
  - Status (draft/published/pending/private)
  - Categories and tags
  - Excerpt
  - Custom URL slug
- Quick publish command using defaults/frontmatter
- Context menu integration for files and folders
- Bulk publish all notes in a folder
- Automatic Markdown to HTML conversion
- Frontmatter support for WordPress settings:
  - `wp_post_type`
  - `wp_status`
  - `wp_categories`
  - `wp_tags`
  - `wp_excerpt`
  - `wp_slug`
- Automatic frontmatter update after publishing:
  - `wp_post_id`
  - `wp_post_url`
  - `wp_last_published`
- Update existing posts (tracks post ID in frontmatter)
- Test connection button in settings
- Ribbon icon for quick access
- Command palette integration

### Fixed
- Improved post ID validation to prevent false update attempts
- Better error handling and logging for debugging
