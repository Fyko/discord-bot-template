import { Command } from '@yuudachi/framework';
import type { ArgsParam, InteractionParam } from '@yuudachi/framework/types';
import type AddCommand from '../../interactions/commands/util/add.js';

export default class<Cmd extends typeof AddCommand> extends Command<Cmd> {
	public override async chatInput(interaction: InteractionParam, args: ArgsParam<Cmd>) {
		const sum = Object.values(args)
			.map(Number)
			.filter((val) => !Number.isNaN(val))
			// eslint-disable-next-line no-param-reassign
			.reduce((acc, val) => (acc += val), 0);

		return interaction.reply(`The sum is ${sum}.`);
	}
}
