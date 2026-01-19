import fs from 'node:fs'
import path from 'node:path'

const outputPath = path.resolve('public', 'build-info.json')
const version = new Date().toISOString()
const payload = {
  version,
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
