import { escapeHtml } from '../lib/html'
import { getAllPosts } from '@/lib/posts'

export class HbFeed extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  private render() {
    const posts = getAllPosts();
    if (posts.length === 0) {
      this.innerHTML = '<p class="feed-empty">No posts yet.</p>'
      return
    }

    this.innerHTML = `
      <div class="feed">
        ${posts
          .map(
            (post) => `
          <a href="/posts/${escapeHtml(post.slug)}" class="feed-link">
            <hb-card
              card-title="${escapeHtml(post.title)}"
              card-date="${escapeHtml(post.date)}"
              card-description="${escapeHtml(post.description)}"
            ></hb-card>
          </a>
        `
          )
          .join('')}
      </div>
    `
  }
}
