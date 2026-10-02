import {defineConfig} from 'astro/config';
// Planned GitHub Pages repository path; no deployment or account URL is implied.
export default defineConfig({
  output:'static',
  base:'/germination-observation-notebook-2026/',
  ...(process.env.PUBLIC_SITE_URL?{site:process.env.PUBLIC_SITE_URL}:{}),
  devToolbar:{enabled:false},
});
