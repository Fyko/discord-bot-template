import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { config } from 'dotenv';
import { generateCommandsArray, write } from './lockfile.js';

process.env.NODE_ENV ??= 'development';
config({ debug: true, path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function updateCommands(body: Record<string, unknown>[]) {
	return rest.put(
		Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID!, process.env.DISCORD_DEV_SERVER_ID),
		{
			body,
		},
	);
}

async function main() {
	const current = await readFile(join(process.cwd(), 'commands.lock.json'), 'utf8').catch(() => null);
	const newState = (await generateCommandsArray()).filter((cmd) => !cmd.dev);
	if (!current) {
		return write(newState);
	}

	if (current.length !== JSON.stringify(newState, null, 2).length) {
		console.log('lockfile state changed!');
		await write(newState);
		await updateCommands(newState);
	}
}

if (process.argv.includes('--force')) {
	const newState = (await generateCommandsArray()).filter((cmd) => !cmd.dev);
	await updateCommands(newState);
} else void main();
