module.exports = {
  branches: ['main'],
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
        prepareCmd: 'node scripts/version-bump.mjs && npm run build'
      }
    ],
    [
      ('@semantic-release/github',
      {
        assets: [
          {
            path: 'tmp/obsidian-ai-research-assistant.zip',
            label: 'Obsidian AI Research Assistant Plugin'
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
