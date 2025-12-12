/**
 * Markdown to HTML Converter
 * Simple converter for common Markdown syntax
 */

export function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Escape HTML entities first (but preserve intentional HTML)
	// html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	// Headers
	html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
	html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
	html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
	html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
	html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
	html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

	// Bold and italic
	html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
	html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
	html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');

	// Strikethrough
	html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

	// Inline code
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

	// Code blocks
	html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
		const langClass = lang ? ` class="language-${lang}"` : '';
		return `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`;
	});

	// Blockquotes
	html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
	// Merge consecutive blockquotes
	html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

	// Horizontal rules
	html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');

	// Links
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// Images
	html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

	// Unordered lists
	html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
	html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

	// Ordered lists
	html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
	// This is simplified - proper ordered list handling would need more logic

	// Paragraphs - wrap remaining text blocks
	html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

	// Clean up empty paragraphs
	html = html.replace(/<p><\/p>/g, '');
	
	// Clean up double line breaks
	html = html.replace(/\n\n+/g, '\n\n');

	return html.trim();
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Extract content without frontmatter
 */
export function extractContent(content: string): { content: string; frontmatter: Record<string, unknown> } {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { content, frontmatter: {} };
	}

	const frontmatterStr = match[1];
	const contentWithoutFrontmatter = content.slice(match[0].length);

	// Parse YAML frontmatter (simple parser)
	const frontmatter: Record<string, unknown> = {};
	const lines = frontmatterStr.split('\n');
	let currentKey = '';
	let currentArray: string[] | null = null;

	for (const line of lines) {
		const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
		const arrayItemMatch = line.match(/^\s+-\s+(.+)$/);

		if (keyValueMatch) {
			if (currentArray && currentKey) {
				frontmatter[currentKey] = currentArray;
			}
			currentKey = keyValueMatch[1];
			const value = keyValueMatch[2].trim();
			
			if (value === '') {
				// Could be start of array
				currentArray = [];
			} else if (value === 'true') {
				frontmatter[currentKey] = true;
				currentArray = null;
			} else if (value === 'false') {
				frontmatter[currentKey] = false;
				currentArray = null;
			} else if (!isNaN(Number(value))) {
				frontmatter[currentKey] = Number(value);
				currentArray = null;
			} else {
				// Remove quotes if present
				frontmatter[currentKey] = value.replace(/^["']|["']$/g, '');
				currentArray = null;
			}
		} else if (arrayItemMatch && currentArray !== null) {
			currentArray.push(arrayItemMatch[1].replace(/^["']|["']$/g, ''));
		}
	}

	// Don't forget last array
	if (currentArray && currentKey) {
		frontmatter[currentKey] = currentArray;
	}

	return { content: contentWithoutFrontmatter, frontmatter };
}

/**
 * Update frontmatter in content
 */
export function updateFrontmatter(content: string, updates: Record<string, unknown>): string {
	const { content: bodyContent, frontmatter } = extractContent(content);
	
	// Merge updates
	const newFrontmatter = { ...frontmatter, ...updates };

	// Build new frontmatter string
	const frontmatterLines = ['---'];
	
	for (const [key, value] of Object.entries(newFrontmatter)) {
		if (Array.isArray(value)) {
			frontmatterLines.push(`${key}:`);
			for (const item of value) {
				frontmatterLines.push(`  - ${item}`);
			}
		} else if (typeof value === 'string' && value.includes(':')) {
			frontmatterLines.push(`${key}: "${value}"`);
		} else {
			frontmatterLines.push(`${key}: ${value}`);
		}
	}
	
	frontmatterLines.push('---');
	frontmatterLines.push('');

	return frontmatterLines.join('\n') + bodyContent;
}
