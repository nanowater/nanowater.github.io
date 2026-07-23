// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
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
});
