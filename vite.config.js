import { defineConfig } from 'vite';

export default defineConfig({
  // свой домен portfolio.abdullohzokirov.uz — сайт в корне; для адреса github.io/portfolio: SITE_BASE=/portfolio/
  base: process.env.SITE_BASE || '/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600, // three.js — 515 КБ (130 КБ в gzip), грузится один раз и кешируется
    rolldownOptions: {
      output: {
        // три большие библиотеки — отдельными файлами, чтобы кешировались между обновлениями сайта
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\/]three/ }, { name: 'gsap', test: /node_modules[\/](gsap|lenis)/ }] },
      },
    },
  },
});
