/**
 * Parse Kerbal Space Program ConfigNode text (e.g. `.sfs`, `.cfg`) into nested plain objects.
 * Duplicate keys at the same level become arrays. All values are strings.
 *
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parse(text) {
	const root = {}
	const stack = []
	let current = root
	/** @type {string} */
	let prevLine = ''

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim()
		if (line === '') continue

		const eq = line.indexOf('=')
		if (eq !== -1) {
			const key = line.slice(0, eq).trim()
			const value = line.slice(eq + 1).trim()
			if (key) {
				assignValue(current, key, value)
			}
			prevLine = ''
			continue
		}

		if (line === '{') {
			const name = prevLine
			if (!name) continue

			if (!current[name]) {
				current[name] = {}
				stack.push(current)
				current = current[name]
			} else if (Array.isArray(current[name])) {
				const obj = {}
				current[name].push(obj)
				stack.push(current)
				current = obj
			} else {
				current[name] = [current[name], {}]
				stack.push(current)
				current = current[name][1]
			}
			continue
		}

		if (line === '}') {
			if (stack.length) {
				current = stack.pop()
			}
			prevLine = ''
			continue
		}

		prevLine = line
	}

	return root
}

/**
 * @param {Record<string, unknown>} node
 * @param {string} key
 * @param {string} value
 */
function assignValue(node, key, value) {
	if (!Object.prototype.hasOwnProperty.call(node, key)) {
		node[key] = value
		return
	}
	const existing = node[key]
	if (Array.isArray(existing)) {
		existing.push(value)
	} else {
		node[key] = [existing, value]
	}
}
