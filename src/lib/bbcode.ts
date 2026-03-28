/**
 * Simple BBCode parser → HTML
 * Supported tags: [b], [i], [u], [s], [color=X], [size=X], [url=X], [img], [code], [quote], [list], [*]
 * Line breaks (\n) are preserved as <br>.
 */

const escapeHtml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function parseBBCode(input: string): string {
  let s = escapeHtml(input);

  // Simple paired tags
  const pairs: [RegExp, string, string][] = [
    [/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>", "</strong>"],
    [/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>", "</em>"],
    [/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>", "</u>"],
    [/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>", "</s>"],
    [/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">', "</code>"],
    [/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="border-l-2 border-primary pl-3 italic opacity-80">', "</blockquote>"],
  ];

  for (const [regex, open, close] of pairs) {
    s = s.replace(regex, (_, content) => `${open}${content}${close}`);
  }

  // [color=X]...[/color]
  s = s.replace(
    /\[color=([a-zA-Z#0-9]+)\]([\s\S]*?)\[\/color\]/gi,
    (_, color, content) => `<span style="color:${escapeHtml(color)}">${content}</span>`
  );

  // [size=X]...[/size] (clamp 8-48)
  s = s.replace(
    /\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi,
    (_, size, content) => {
      const px = Math.min(48, Math.max(8, parseInt(size)));
      return `<span style="font-size:${px}px">${content}</span>`;
    }
  );

  // [url=X]...[/url] and [url]...[/url]
  s = s.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_, url, text) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${text}</a>`
  );
  s = s.replace(
    /\[url\]([\s\S]*?)\[\/url\]/gi,
    (_, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${url}</a>`
  );

  // [img]...[/img]
  s = s.replace(
    /\[img\]([\s\S]*?)\[\/img\]/gi,
    (_, url) => `<img src="${escapeHtml(url)}" class="max-w-full rounded my-1" alt="" />`
  );

  // [list] / [*]
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, content) => {
    const items = content
      .split(/\[\*\]/)
      .filter((item: string) => item.trim())
      .map((item: string) => `<li>${item.trim()}</li>`)
      .join("");
    return `<ul class="list-disc pl-5 space-y-1">${items}</ul>`;
  });

  // Line breaks
  s = s.replace(/\n/g, "<br>");

  return s;
}
