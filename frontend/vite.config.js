const { createVuePlugin } = require('vite-plugin-vue2');
import { viteSingleFile } from "vite-plugin-singlefile"

module.exports = {
  plugins: [
    createVuePlugin(),
    viteSingleFile(),
  ],
  base: './',
  server: {
    proxy: {
      '/llm/': {
        target: `http://127.0.0.1:8080/`,
        rewrite: (path) => path.replace(/^\/llm\//, ''),
      },
    },
  },
};
