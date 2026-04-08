#!/usr/bin/env node
/**
 * Copies repo-root icon.svg into public/app/, then writes PNGs for PWA / Apple touch.
 */
import { createHash } from 'crypto'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconSrc = join(root, 'icon.svg')
const outDir = join(root, 'public', 'app')

async function run() {
	mkdirSync(outDir, { recursive: true })
	copyFileSync(iconSrc, join(outDir, 'icon.svg'))

	await sharp(iconSrc).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'))
	await sharp(iconSrc).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'))
	await sharp(iconSrc).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png'))

	const svgBuf = readFileSync(iconSrc)
	const sha256 = createHash('sha256').update(svgBuf).digest('hex')
	writeFileSync(join(outDir, 'icon.svg.sha256'), `${sha256}\n`)
}

run().catch((err) => {
	console.error(err)
	process.exit(1)
})
