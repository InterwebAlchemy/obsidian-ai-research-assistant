import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const targetVersion = process.env.npm_package_version

console.log(`Bumping version to ${targetVersion}...`)

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const { minAppVersion } = manifest
manifest.version = targetVersion

writeFileSync(
  join('dist', 'manifest.json'),
  JSON.stringify(manifest, null, '\t')
)

writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))

// update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[targetVersion] = minAppVersion
writeFileSync(
  join('dist', 'versions.json'),
  JSON.stringify(versions, null, '\t')
)

writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))
