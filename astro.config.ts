import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	srcDir: './docs',
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
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', link: '/guides/example/' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: ['./docs/styles.css'],
		}),
	],
});
