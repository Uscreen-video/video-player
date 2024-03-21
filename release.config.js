/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: [
    "main",
    {
      name: "next",
      prerelease: true
    }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    // "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        assets: ["package.json", "CHANGELOG.md", "lib/**"],
      }
    ]
  ]
}
