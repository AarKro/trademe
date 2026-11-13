import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the PWA / home-screen icons from public/favicon.svg: `npm run icons`
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
