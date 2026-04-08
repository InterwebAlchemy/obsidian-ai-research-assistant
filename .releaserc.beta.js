module.exports = {
  branches: [{ name: 'main', channel: 'beta', prerelease: 'beta' }],
  // eslint-disable-next-line no-template-curly-in-string
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
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'release/obsidian-ai-research-assistant.zip',
            label: 'Obsidian AI Research Assistant Plugin'
          },
          {
            path: 'dist/main.js'
          },
          {
            path: 'dist/manifest.json'
          },
          {
            path: 'manifest-beta.json'
          },
          {
            path: 'dist/styles.css'
          }
        ]
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'package-lock.json', 'manifest-beta.json'],
        message:
          // eslint-disable-next-line no-template-curly-in-string
          'chore(release): updating to ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
