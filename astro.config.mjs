// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { visit } from 'unist-util-visit';

/** @type {import('unified').Plugin} */
function rehypeImageCaption() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			const el = /** @type {any} */ (node);
			const par = /** @type {any} */ (parent);
			if (
				el.tagName === 'img' &&
				el.properties?.alt &&
				par?.tagName === 'p'
			) {
				const alt = el.properties.alt;
				const figure = {
					type: 'element',
					tagName: 'figure',
					properties: {},
					children: [
						el,
						{
							type: 'element',
							tagName: 'figcaption',
							properties: {},
							children: [{ type: 'text', value: alt }],
						},
					],
				};
				par.children.splice(index, 1, figure);
			}
		});
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://nanowater.github.io',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			theme: 'one-dark-pro',
		},
		rehypePlugins: [/** @type {any} */ (rehypeImageCaption)],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
