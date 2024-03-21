import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  rootDir: '.',
  files: 'src/components/**/*.test.ts',
  concurrentBrowsers: 3,
  nodeResolve: {
    exportConditions: ['production', 'default']
  },
  testFramework: {
    config: {
      timeout: 3000,
      retries: 1
    }
  },
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto'
    })
  ],
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  testRunnerHtml: testFramework => `
    <html lang="en-US">
      <head></head>
      <body>
        <script type="module">
          import './dist/index.js';
          import '${testFramework}';
        </script>
      </body>
    </html>
  `,
};
