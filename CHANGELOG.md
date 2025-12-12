# Changelog

All notable changes to the WordPress Publisher plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-12-12

### Fixed
- Fixed HTTP 301 redirect issue causing POST requests to fail on sites with www redirects
- Fixed invalid post ID validation preventing new posts from being created
- Improved request body handling for WordPress REST API compatibility
- Added response validation to detect malformed WordPress responses

### Changed
- Updated Site URL field description to clarify www requirement
- Added comprehensive console logging for easier debugging
- Improved error messages for troubleshooting

### Security
- Added `data.json` to `.gitignore` to prevent credential exposure

## [1.0.0] - 2025-12-12

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
- MIT License
- User Guide documentation
