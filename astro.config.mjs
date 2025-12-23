// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import netlify from '@astrojs/netlify';

// Automatically use Node adapter for local dev, Netlify for production
// The Netlify adapter causes POST requests to hang in local dev
const isProd = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';

export default defineConfig({
  site: "https://astron00b.com",
  output: 'server', // SSR mode - we'll prerender static pages
  
  // Automatically switch adapters based on environment
  adapter: isProd 
    ? netlify() 
    : node({ mode: 'standalone' })
});
