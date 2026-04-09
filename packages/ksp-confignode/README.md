# ksp-confignode

Parse **Kerbal Space Program** [ConfigNode](https://wiki.kerbalspaceprogram.com/wiki/User:Greys/The_CFG_File_and_ConfigNodes) text (e.g. `.sfs` save files, `.cfg` part definitions) into plain JavaScript objects.

## Install

```bash
npm install ksp-confignode
```

In this monorepo the package is linked via npm workspaces (`"ksp-confignode": "workspace:*"`).

## Usage

```javascript
import { parse } from 'ksp-confignode'

const tree = parse(fs.readFileSync('persistent.sfs', 'utf8'))
console.log(tree.GAME?.Title)
```

## Behavior

- **Nested blocks** become nested objects keyed by the block name.
- **Duplicate keys** at the same level become **arrays** of values or child objects.
- **Values are strings**; callers parse numbers/booleans if needed.
- Lines split on the **first `=`** only, so values may contain `=` characters.

## Testing

Integration coverage uses a **real career save** shipped as `fixtures/20260407-4-move-the-rover.sfs.gz` (gzip’d for repo size); see [fixtures/README.md](fixtures/README.md).

## Roadmap

See [docs/roadmap/](docs/roadmap/) (e.g. **serializer** for round-trip output).

## License

MIT (see repository root).
