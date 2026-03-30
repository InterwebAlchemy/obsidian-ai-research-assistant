import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const targetVersion = process.env.npm_package_version
const isPreRelease = targetVersion.includes('-')

console.log(`Bumping version to ${targetVersion}...`)

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const { minAppVersion } = manifest
manifest.version = targetVersion

// Always update dist/manifest.json so the build reflects the correct version
writeFileSync(
  join('dist', 'manifest.json'),
  JSON.stringify(manifest, null, '\t')
)

if (isPreRelease) {
  // Pre-release: update manifest-beta.json only (BRAT reads this for beta installs)
  // manifest.json and versions.json are left unchanged to preserve the stable release state
  writeFileSync('manifest-beta.json', JSON.stringify(manifest, null, '\t'))
} else {
  // Stable release: update manifest.json and versions.json
  writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))

  const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
  versions[targetVersion] = minAppVersion
  writeFileSync(
    join('dist', 'versions.json'),
    JSON.stringify(versions, null, '\t')
  )
  writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))
}
