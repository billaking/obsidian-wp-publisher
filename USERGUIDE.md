# WordPress Publisher for Obsidian - User Guide

Publish your Obsidian notes directly to WordPress as posts or pages.

---

## Table of Contents

1. [Installation](#installation)
2. [Setting Up WordPress](#setting-up-wordpress)
3. [Configuring the Plugin](#configuring-the-plugin)
4. [Publishing Notes](#publishing-notes)
5. [Using Frontmatter](#using-frontmatter)
6. [Updating Existing Posts](#updating-existing-posts)
7. [Bulk Publishing](#bulk-publishing)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings → **Community plugins**
2. Click **Browse** and search for "WordPress Publisher"
3. Click **Install**, then **Enable**

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/obsidian-wp-publisher/` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

---

## Setting Up WordPress

Before using this plugin, you need to create an **Application Password** in WordPress. This is a secure way to authenticate without using your main password.

### Step 1: Enable Application Passwords

Application Passwords are built into WordPress 5.6 and later. If you're using an older version, please update WordPress.

### Step 2: Create an Application Password

1. Log in to your WordPress admin dashboard
2. Go to **Users → Profile** (or click your username in the top-right)
3. Scroll down to the **Application Passwords** section
4. Enter a name for the application (e.g., "Obsidian Publisher")
5. Click **Add New Application Password**
6. **Important:** Copy the generated password immediately! It will look like: `xxxx xxxx xxxx xxxx xxxx xxxx`
7. Save this password securely - you won't be able to see it again

![Application Passwords are found in your WordPress user profile](https://wordpress.org/documentation/files/2023/10/application-passwords.png)

---

## Configuring the Plugin

### Step 1: Open Plugin Settings

1. Go to Obsidian **Settings** → **Community plugins**
2. Find "WordPress Publisher" and click the gear icon (⚙️)

### Step 2: Add Your WordPress Site

1. Click **Add Site**
2. Fill in the following details:

| Field | Description | Example |
|-------|-------------|---------|
| **Site Name** | A friendly name for your site | My Blog |
| **Site URL** | Your WordPress site URL (include `www` if your site uses it) | `https://www.example.com` |
| **Username** | Your WordPress username | admin |
| **Application Password** | The password you generated in WordPress | `xxxx xxxx xxxx xxxx xxxx xxxx` |

3. Toggle **Default Site** if this is your primary WordPress site
4. Click **Test** to verify the connection

### Step 3: Configure Default Settings

| Setting | Description |
|---------|-------------|
| **Default Post Type** | Choose "Post" or "Page" as the default |
| **Default Status** | "Draft" (safer) or "Published" (goes live immediately) |
| **Convert Markdown to HTML** | Converts your Markdown formatting to HTML |
| **Update Frontmatter** | Adds WordPress post ID and URL to your note after publishing |
| **Upload Images** | Uploads embedded images to WordPress Media Library |

---

## Publishing Notes

### Method 1: Ribbon Icon
1. Open the note you want to publish
2. Click the **cloud upload icon** (☁️↑) in the left ribbon
3. Configure your publish settings in the modal
4. Click **Publish**

### Method 2: Command Palette
1. Open the note you want to publish
2. Press `Cmd/Ctrl + P` to open the Command Palette
3. Search for "Publish current note to WordPress"
4. Configure settings and publish

### Method 3: Context Menu
1. Right-click on a note in the file explorer
2. Select **Publish to WordPress**
3. Configure settings and publish

### Method 4: Quick Publish
For faster publishing using your defaults:
1. Open the Command Palette (`Cmd/Ctrl + P`)
2. Search for "Quick publish (use defaults)"
3. The note publishes immediately using default settings

Or right-click a note and select **Quick publish to WordPress**.

---

## Using Frontmatter

Control publishing options directly in your notes using YAML frontmatter at the top of your file:

```yaml
---
wp_post_type: post
wp_status: draft
wp_title: My Custom Title
wp_categories:
  - Announcements
  - News
wp_tags:
  - obsidian
  - productivity
wp_excerpt: A brief description of this post for previews and SEO.
wp_slug: my-custom-url-slug
---

Your note content starts here...
```

### Available Frontmatter Fields

| Field | Values | Description |
|-------|--------|-------------|
| `wp_post_type` | `post`, `page` | Content type |
| `wp_status` | `draft`, `publish`, `pending`, `private` | Publish status |
| `wp_title` | Any text | Override the note's filename as title |
| `wp_categories` | List of names | Categories (posts only) |
| `wp_tags` | List of names | Tags (posts only) |
| `wp_excerpt` | Any text | Short description/summary |
| `wp_slug` | URL-safe text | Custom URL slug |

### Auto-Generated Frontmatter

After publishing, the plugin adds these fields to your note:

```yaml
---
wp_post_id: 123
wp_post_url: https://www.example.com/my-post/
wp_last_published: 2024-12-12
---
```

---

## Updating Existing Posts

Once you've published a note, the plugin tracks it using the `wp_post_id` in your frontmatter.

To update an existing post:
1. Edit your note
2. Publish it again using any method
3. The plugin will **update** the existing WordPress post instead of creating a new one

The publish modal will show: `📝 Updating existing post #123`

### Creating a New Post Instead

If you want to create a new post from an already-published note:
1. Remove the `wp_post_id` line from the frontmatter
2. Publish the note
3. A new post will be created

---

## Bulk Publishing

### Publish All Notes in a Folder

1. Right-click on a folder in the file explorer
2. Select **Publish all notes to WordPress**
3. Confirm the action
4. All Markdown files in that folder will be published using default settings

**Note:** This uses Quick Publish, so ensure your default settings are configured correctly.

---

## Troubleshooting

### "Connection failed" when testing

**Possible causes:**
- **Wrong URL:** Make sure to include `https://` and `www` if your site uses it
- **Wrong username:** Use your WordPress username, not your email
- **Wrong password:** Application passwords have spaces - include them exactly as shown
- **REST API disabled:** Some security plugins disable the REST API

**To verify your site's REST API:**
Visit `https://yoursite.com/wp-json/wp/v2/` in a browser. You should see JSON data.

### Post says "successful" but doesn't appear on site

**Possible causes:**
- **Status is "Draft":** Check your default status setting, or change it in the publish modal
- **Post is scheduled:** If using a future date
- **Caching:** Your site might be caching. Clear the cache or wait a few minutes

**To find drafts:**
Go to WordPress Admin → Posts → All Posts → Click "Draft" filter

### "Invalid response (no post ID)"

**Possible causes:**
- **URL redirect issue:** If your site redirects (e.g., `example.com` → `www.example.com`), use the final URL
- **REST API blocked:** Some hosts block certain API requests
- **Plugin conflict:** Try disabling security plugins temporarily

### Images not uploading

**Possible causes:**
- **File size:** WordPress has upload limits (usually 2-8MB)
- **File type:** Ensure images are JPG, PNG, GIF, or WebP
- **Permissions:** Your WordPress user needs upload capabilities

### Changes not appearing after editing

After making changes to the plugin's TypeScript files:
1. Rebuild: `npm run build`
2. Reload the plugin in Obsidian (disable → enable)

---

## Tips & Best Practices

1. **Start with Draft status** until you're comfortable with the workflow
2. **Use frontmatter templates** for consistent publishing settings
3. **Test the connection** whenever you update credentials
4. **Keep your Application Password secure** - treat it like a password
5. **Check the Developer Console** (`Cmd/Ctrl + Shift + I`) for detailed logs if something goes wrong

---

## Getting Help

- **GitHub Issues:** Report bugs or request features
- **Obsidian Discord:** Join the #plugins channel for community support

---

## License

MIT License - See [LICENSE](LICENSE) for details.
