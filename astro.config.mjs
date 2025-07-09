// @ts-check
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gideonmaina.me',
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap({
    customPages: [
      'https://gideonmaina.me/blog',
      // Blog post pages will be automatically detected
    ],
  })],
});
