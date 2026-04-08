#!/usr/bin/env node
/**
 * Ensures repo-root icon.svg matches the committed fingerprint (public/app/icon.svg.sha256).
 */
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconSrc = join(root, 'icon.svg')
const fingerprintPath = join(root, 'public', 'app', 'icon.svg.sha256')

if (!existsSync(iconSrc)) {
	console.error('verify-app-icon: missing repo-root icon.svg')
	process.exit(1)
}

if (!existsSync(fingerprintPath)) {
	console.error(
		'verify-app-icon: missing public/app/icon.svg.sha256 — run `npm run icons` once and commit public/app/',
	)
	process.exit(1)
}

const svgBuf = readFileSync(iconSrc)
const actual = createHash('sha256').update(svgBuf).digest('hex')
const expected = readFileSync(fingerprintPath, 'utf8').trim()

if (actual !== expected) {
	console.error(
		'verify-app-icon: source icon.svg changed since last `npm run icons`. Run `npm run icons` and commit public/app/.',
	)
	process.exit(1)
}
