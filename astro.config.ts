import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import meta from './docs/meta'
import { StarlightUserConfigWithPlugins } from '@astrojs/starlight/utils/plugins';

// https://astro.build/config
export default defineConfig({
	srcDir: './docs',
	outDir: './docs_dist',
	integrations: [
		tailwind({ applyBaseStyles: false }),
		starlight({
			title: 'Uscreen Video Player',
			social: {
				github: 'https://github.com/Uscreen-video/video-player',
			},
			customCss: [
				'@fontsource/manrope/600.css',
				'./docs/styles.css',
			],
			expressiveCode: {
        frames: {
          showCopyToClipboardButton: true
        },
        useStarlightDarkModeSwitch: true,
        useStarlightUiThemeColors: true
      },
			
			...(meta as Partial<StarlightUserConfigWithPlugins>)
		}),
	],
});
