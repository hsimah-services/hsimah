interface Post {
  slug: string
  title: string
  date: string
  description: string
  image?: string
  content: string
}

const modules = import.meta.glob('/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function parseFrontmatter(raw: string): { metadata: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { metadata: {}, content: raw }
  }

  const metadata: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx !== -1) {
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      metadata[key] = value
    }
  }

  return { metadata, content: match[2].trim() }
}

function toPost(filename: string, raw: string): Post {
  const slug = filename.replace('/posts/', '').replace('.md', '')
  const { metadata, content } = parseFrontmatter(raw)
  return {
    slug,
    title: metadata.title ?? slug,
    date: metadata.date ?? '',
    description: metadata.description ?? '',
    image: metadata.image,
    content,
  }
}

export function getAllPosts(): Post[] {
  return Object.entries(modules)
    .map(([filename, raw]) => toPost(filename, raw))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  const key = `/posts/${slug}.md`
  const raw = modules[key]
  if (!raw) return undefined
  return toPost(key, raw)
}
