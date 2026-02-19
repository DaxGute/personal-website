import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // If you have client-side routing / an SPA feel, keep fallback:
      fallback: '404.html'
    }),
    prerender: {
      default: true
    }
  }
};
