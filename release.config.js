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
      '@semantic-release/github',
      {
        assets: [{ path: 'dist', label: 'Obsidian AI Research Assistant' }]
      }
    ],
    '@semantic-release/git'
  ]
}
