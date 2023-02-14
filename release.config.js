module.exports = {
  branches: ['main'],
  tagFormat: '${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/version-bump.mjs'
      }
    ],
    [
      ('@semantic-release/github',
      {
        assets: [
          {
            path: 'tmp/obsidian-ai-research-assistant.zip',
            label: 'Obsidian AI Research Assistant Plugin'
          },
          {
            path: 'dist/main.js'
          },
          {
            path: 'dist/manifest.json'
          },
          {
            path: 'dist/versions.json'
          },
          {
            path: 'dist/styles.css'
          }
        ]
      })
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'manifest.json', 'versions.json'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
