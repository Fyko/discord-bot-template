import { Command } from '@yuudachi/framework';
import type { InteractionParam } from '@yuudachi/framework/types';
import type PingCommand from '../../interactions/commands/util/ping.js';

export default class<Cmd extends typeof PingCommand> extends Command<Cmd> {
	public override async chatInput(interaction: InteractionParam) {
		const pongs = [
			'Uhh, hello?',
			"What can I do ya' for?",
			'Why are you bothering me?',
			'Mhm?',
			'Yea?',
			"What's with you puny humans and the constant desire to bother me?",
			'Out of everyone here, you chose to bother me?',
			'So *this* is the meaning of life?',
			'Can we just get this over with?? I have stuff to do.',
			"That's all?",
			'Pong!',
			'Do it again. I dare you.',
		];

		const content = pongs[Math.floor(Math.random() * pongs.length)];

		return interaction.reply(content!);
	}
}
