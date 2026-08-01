/// <reference types="node" />
import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'

const USE_CLIENT = '"use client";\n'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  minify: false,
  external: ['react'],
  async onSuccess() {
    for (const file of ['dist/index.js', 'dist/index.mjs']) {
      const content = readFileSync(file, 'utf-8')
      if (!content.startsWith(USE_CLIENT)) {
        writeFileSync(file, USE_CLIENT + content)
      }
    }
  },
})
