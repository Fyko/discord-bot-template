import 'reflect-metadata';

import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Command } from '@yuudachi/framework';
import { commandInfo, container, createClient, createCommands, dynamicImport, kCommands } from '@yuudachi/framework';
import type { Event } from '@yuudachi/framework/types';
import { IntentsBitField, Options } from 'discord.js';
import { config } from 'dotenv';
import readdirp from 'readdirp';
import { logger } from './util/logger.js';

process.env.NODE_ENV ??= 'development';
config({ debug: true });

process.env.NODE_ENV ??= 'development';
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_APPLICATION_ID: string;
			DISCORD_DEV_SERVER_ID: string;
			DISCORD_TOKEN: string;
		}
	}
}

createCommands();

const client = createClient({
	shards: 'auto',
	intents: [IntentsBitField.Flags.Guilds],
	makeCache: Options.cacheWithLimits({
		MessageManager: 5,
		PresenceManager: 0,
		GuildEmojiManager: 0,
	}),
});

logger.debug('Starting Fykobot');

const commands = container.resolve<Map<string, Command>>(kCommands);
const commandFiles = readdirp(fileURLToPath(new URL('commands', import.meta.url)), {
	fileFilter: '*.js',
	directoryFilter: '!sub',
});

for await (const file of commandFiles) {
	const cmdInfo = commandInfo(file.path);

	if (!cmdInfo) continue;

	const dynamic = dynamicImport<new () => Command>(async () => import(pathToFileURL(file.fullPath).href));
	const command = container.resolve<Command>((await dynamic()).default);

	logger.info(
		{ command: { name: command.name?.join(', ') ?? cmdInfo.name } },
		`Registering command: ${command.name?.join(', ') ?? cmdInfo.name}`,
	);

	if (command.name) {
		for (const name of command.name) {
			commands.set(name.toLowerCase(), command);
		}
	} else {
		commands.set(cmdInfo.name.toLowerCase(), command);
	}
}

const eventFiles = readdirp(fileURLToPath(new URL('events', import.meta.url)), {
	fileFilter: '*.js',
});

for await (const file of eventFiles) {
	const dynamic = dynamicImport<new () => Event>(async () => import(pathToFileURL(file.fullPath).href));
	const event_ = container.resolve<Event>((await dynamic()).default);
	logger.info({ event: { name: event_.name, event: event_.event } }, `Registering event: ${event_.name}`);

	if (event_.disabled) {
		continue;
	}

	void event_.execute();
}

void client.login(process.env.DISCORD_TOKEN);

// listen for close signal
for (const signale of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
	process.on(signale, async () => {
		logger.info(`Received ${signale}, shutting down gracefully..`);
		await client.destroy();
		process.exit(0);
	});
}
