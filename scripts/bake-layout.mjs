#!/usr/bin/env node
/**
 * Copies an app 「导出布局 JSON」into src/config/bundledLayoutOverrides.js
 * and bumps bundledRevision / TEMPLATE_LAYOUT_VERSION together (see layoutVersion.js).
 *
 * Usage: npm run bake-layout -- path/to/groomreport-layout-overrides.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'src/config/bundledLayoutOverrides.js')
const LAYOUT_VERSION_FILE = path.join(ROOT, 'src/config/layoutVersion.js')

const jsonPathArg = process.argv[2]

if (!jsonPathArg) {
  console.error('Usage (from repo root): npm run bake-layout -- path/to/groomreport-layout-overrides.json')
  process.exit(1)
}

const jsonPath = path.isAbsolute(jsonPathArg) ? jsonPathArg : path.resolve(process.cwd(), jsonPathArg)

if (!fs.existsSync(jsonPath)) {
  console.error('File not found:', jsonPath)
  process.exit(1)
}
const exported = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const prevTxt = fs.readFileSync(OUT, 'utf8')
const mr = prevTxt.match(/bundledRevision:\s*(\d+)/)
const prevRev = mr ? Number(mr[1]) : 0
const nextRev = prevRev + 1

const shape = {
  version: typeof exported.version === 'number' ? exported.version : 1,
  bundledRevision: nextRev,
  regions:
    exported.regions && typeof exported.regions === 'object' && !Array.isArray(exported.regions)
      ? exported.regions
      : {},
  marks:
    exported.marks && typeof exported.marks === 'object' && !Array.isArray(exported.marks)
      ? exported.marks
      : {},
  fields:
    exported.fields && typeof exported.fields === 'object' && !Array.isArray(exported.fields)
      ? exported.fields
      : {},
  strips:
    exported.strips && typeof exported.strips === 'object' && !Array.isArray(exported.strips)
      ? exported.strips
      : {},
}

const outBody = `/**
 * Repo-shipped layout patches (regions / marks / fields / strips in template bitmap px).
 * This is the default for everyone; localStorage (\`groomreport-layout-ui-v3\`) overlays on top until reset.
 *
 * To lock edits from the UI as the shipped default:
 * 1.「导出布局 JSON」in the app
 * 2. From repo root: \`npm run bake-layout -- path/to/export.json\`
 */

export default ${JSON.stringify(shape, null, 2)}
`

fs.writeFileSync(OUT, outBody, 'utf8')

const lvIn = fs.readFileSync(LAYOUT_VERSION_FILE, 'utf8')
const lvOut = lvIn.replace(/export const TEMPLATE_LAYOUT_VERSION = \d+/, () => `export const TEMPLATE_LAYOUT_VERSION = ${nextRev}`)
fs.writeFileSync(LAYOUT_VERSION_FILE, lvOut, 'utf8')

console.log(
  `Wrote bundled layout (${Object.keys(shape.regions).length} regions, ${Object.keys(shape.marks).length} marks, ${Object.keys(shape.fields).length} fields, ${Object.keys(shape.strips).length} health strips)`,
)
console.log(`bundledRevision & TEMPLATE_LAYOUT_VERSION → ${nextRev}`)
