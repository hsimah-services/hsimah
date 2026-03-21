import aboutRaw from '/pages/about.md?raw'
import { parseFrontmatter } from '@/lib/posts'
import { escapeHtml } from '@/lib/html'
import type { HbMarkdownRenderer } from './hb-markdown-renderer'

export class HbAbout extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  private render() {
    const { metadata, content } = parseFrontmatter(aboutRaw)
    const title = metadata.title ?? 'About'
    const image = metadata.image

    const imageHtml = image
      ? `<div class="about-image-container">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="about-image" />
        </div>`
      : ''

    this.innerHTML = `
      <article class="about">
        ${imageHtml}
        <hb-markdown-renderer></hb-markdown-renderer>
      </article>
    `

    const renderer = this.querySelector<HbMarkdownRenderer>('hb-markdown-renderer')!
    renderer.setContent(content)
  }
}
