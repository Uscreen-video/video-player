import colors from 'tailwindcss/colors';
import starlightPlugin from '@astrojs/starlight-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./docs/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				accent: '#006AFF',
				black: '#18181B',
			},
		},
		fontFamily: {
			title: ['Manrope', 'sans-serif'],
		}
	},
	plugins: [starlightPlugin()],
};
