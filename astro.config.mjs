// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: "https://astron00b.com",
  output: 'server', // SSR mode - we'll prerender static pages
  adapter: netlify(),
});
