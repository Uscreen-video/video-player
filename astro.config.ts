import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

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
			components: {
				'Hero': './docs/components/Hero.astro',
				'Header': './docs/components/Header.astro'
			},
			sidebar: [
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: [
				'@fontsource/manrope/600.css',
				'./docs/styles.css',
			],
		}),
	],
});
