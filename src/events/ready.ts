import type { Event } from '@yuudachi/framework/types';
import { Client, Events } from 'discord.js';
import { injectable } from 'tsyringe';
import { logger } from '../util/logger.js';

@injectable()
export default class implements Event {
	public name = 'Ready handling';

	public event = Events.ClientReady as const;

	public constructor(private readonly client: Client<true>) {}

	public execute(): void {
		this.client.on(this.event, async () => {
			logger.info(`Client is ready! Logged in as ${this.client.user!.tag}`);
		});
	}
}
