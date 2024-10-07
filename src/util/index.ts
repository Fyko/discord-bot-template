import { extname } from 'node:path';
import { scan } from 'fs-nextra';

export async function walk(path: string) {
	return (
		await scan(path, {
			filter: (stats, path) =>
				stats.isFile() && ['.js', '.ts'].includes(extname(stats.name)) && !path.includes('sub'),
		})
	).keys();
}

export const chunkArray = <Type>(list: Type[], chunksize: number): Type[][] =>
	Array.from({ length: Math.ceil(list.length / chunksize) })
		.fill(undefined)
		.map(() => list.splice(0, chunksize));

export function randomRange(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatNumberK(number: number) {
	if (number > 999_999_999)
		return `${(number / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`;
	if (number > 999_999) return `${(number / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
	if (number > 999) return `${(number / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
	return number;
}
