import { HbApp } from './hb-app'
import { HbHeader } from './hb-header'
import { HbCard } from './hb-card'
import { HbFeed } from './hb-feed'
import { HbMarkdownRenderer } from './hb-markdown-renderer'
import { HbBlogPost } from './hb-blog-post'
import { HbAbout } from './hb-about'

customElements.define('hb-markdown-renderer', HbMarkdownRenderer)
customElements.define('hb-header', HbHeader)
customElements.define('hb-card', HbCard)
customElements.define('hb-feed', HbFeed)
customElements.define('hb-blog-post', HbBlogPost)
customElements.define('hb-about', HbAbout)
customElements.define('hb-app', HbApp)
