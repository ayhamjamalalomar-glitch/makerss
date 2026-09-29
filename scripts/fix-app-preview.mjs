// After `npm run export:preview` in mobile/: git ignores node_modules/, so move Expo's
// assets/node_modules to assets/nm, point the bundle at it, and keep the page out of search.
import fs from 'fs'
import path from 'path'
const root = path.resolve(import.meta.dirname, '../public/app')
const from = path.join(root, 'assets/node_modules')
if (fs.existsSync(from)) fs.renameSync(from, path.join(root, 'assets/nm'))
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
for (const f of walk(path.join(root, '_expo'))) {
  if (!/\.(js|css)$/.test(f)) continue
  const s = fs.readFileSync(f, 'utf8')
  if (s.includes('assets/node_modules/')) fs.writeFileSync(f, s.replaceAll('assets/node_modules/', 'assets/nm/'))
}
const html = path.join(root, 'index.html')
const h = fs.readFileSync(html, 'utf8')
if (!h.includes('noindex')) fs.writeFileSync(html, h.replace('<head>', '<head><meta name="robots" content="noindex" /><title>Makers App Preview</title>'))
