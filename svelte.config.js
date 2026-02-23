import adapter from '@sveltejs/adapter-static';

const repo = 'personal-website'; // <-- change this

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // Optional but recommended for GitHub Pages SPA-ish routing:
      // This creates build/404.html so refreshes on subroutes don’t 404.
      fallback: '404.html'
    }),
    paths: {
      base: '',
    }
  }
};

export default config;