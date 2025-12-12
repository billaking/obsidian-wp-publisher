# WordPress Publisher for Obsidian

Publish your Obsidian notes directly to WordPress as posts or pages.

## Features

- 📝 **Publish notes** as WordPress posts or pages
- 🔄 **Update existing** posts by re-publishing
- 📁 **Bulk publish** entire folders
- 🏷️ **Categories & Tags** support with auto-creation
- ⚡ **Quick publish** using frontmatter defaults
- 🌐 **Multiple sites** support
- 🔒 **Secure** authentication via Application Passwords

## Installation

### From Obsidian

1. Open Settings → Community Plugins
2. Search for "WordPress Publisher"
3. Install and enable

### Manual Installation

1. Download the latest release
2. Extract to `.obsidian/plugins/obsidian-wp-publisher/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Development

```bash
cd obsidian-wp-publisher
npm install
npm run dev
```

## Setup

### 1. Create WordPress Application Password

1. In WordPress, go to **Users → Profile**
2. Scroll to **Application Passwords**
3. Enter a name (e.g., "Obsidian Publisher")
4. Click **Add New Application Password**
5. Copy the generated password (you won't see it again!)

### 2. Configure the Plugin

1. In Obsidian, go to **Settings → WordPress Publisher**
2. Click **Add Site**
3. Enter:
   - **Site Name**: A friendly name
   - **Site URL**: Your WordPress URL (e.g., `https://mysite.com`)
   - **Username**: Your WordPress username
   - **Application Password**: The password from step 1
4. Click **Test** to verify connection

## Usage

### Publish Current Note

- Click the cloud icon in the ribbon, OR
- Use command palette: "Publish current note to WordPress"
- Right-click note → "Publish to WordPress"

### Quick Publish (No Dialog)

- Use command palette: "Quick publish (use defaults)"
- Right-click note → "Quick publish to WordPress"

### Bulk Publish

- Right-click a folder → "Publish all notes to WordPress"

## Frontmatter Options

Control publishing behavior with YAML frontmatter:

```yaml
---
wp_post_type: post        # 'post' or 'page'
wp_status: draft          # 'publish', 'draft', 'pending', 'private'
wp_title: "Custom Title"  # Override note filename as title
wp_categories:            # Category names (posts only)
  - Announcements
  - Events
wp_tags:                  # Tag names (posts only)
  - sunday-service
  - 2025
wp_excerpt: "A brief summary of the content..."
wp_slug: custom-url-slug  # URL slug

# Auto-populated after publishing:
wp_post_id: 123
wp_post_url: "https://mysite.com/my-post/"
wp_last_published: 2025-12-12
---
```

## Examples

### Blog Post

```markdown
---
wp_post_type: post
wp_status: draft
wp_categories:
  - Church News
wp_tags:
  - announcements
---

# Sunday Service Update

This week's service will feature a special guest speaker...
```

### Static Page

```markdown
---
wp_post_type: page
wp_status: publish
wp_slug: about-us
---

# About Our Church

Welcome to Grace Temple...
```

### Update Existing Post

Once published, your note will have `wp_post_id` in the frontmatter. 
Re-publishing will update that post instead of creating a new one.

## Multiple Sites

Configure multiple WordPress sites in settings. Mark one as "Default" for quick publishing.

When using the full publish dialog, you can choose which site to publish to.

## Troubleshooting

### "Connection failed"

- Verify your Site URL is correct (include `https://`)
- Check that your username is correct
- Make sure Application Password was copied correctly (remove spaces)
- Ensure REST API is enabled on your WordPress site

### "Could not authenticate"

- Application Password may have been revoked
- Username might be wrong
- Try generating a new Application Password

### "Failed to create post"

- Check if your user has permission to create posts/pages
- Verify the REST API is accessible

## License

MIT License - feel free to modify and distribute.

## Author

Bill A. King

## Support

For issues or feature requests, please open an issue on GitHub.
