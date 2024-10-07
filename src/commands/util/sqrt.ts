import process from 'node:process';
import { Command } from '@yuudachi/framework';
import type { ArgsParam, InteractionParam } from '@yuudachi/framework/types';
import { stripIndents } from 'common-tags';
import { inlineCode } from 'discord.js';
import type SqrtCommand from '../../interactions/commands/util/sqrt.js';

export default class<Cmd extends typeof SqrtCommand> extends Command<Cmd> {
	public override async chatInput(interaction: InteractionParam, args: ArgsParam<Cmd>) {
		await interaction.deferReply();

		const start = process.hrtime();
		const sqrt = Math.sqrt(args.number);
		const stop = process.hrtime(start);

		return interaction.editReply(
			stripIndents`
			The square root of ${inlineCode(args.number.toString())} is ${inlineCode(sqrt.toString())}.
			Took ${inlineCode(`${(stop[0] * 1e9 + stop[1]) / 1e6}ms`)} to calculate.
		`,
		);
	}
}
