import { Buffer } from 'node:buffer';
import process from 'node:process';
import { inspect } from 'node:util';
import { Command, kCommands } from '@yuudachi/framework';
import type { ArgsParam, InteractionParam } from '@yuudachi/framework/types';
import { stripIndents } from 'common-tags';
import { Client } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import type EvalCommand from '../../interactions/commands/util/eval.js';

export const SENSITIVE_PATTERN_REPLACEMENT = '[REDACTED]';

const MESSAGES = {
	COMMANDS: {
		EVAL: {
			INPUT: (code: string): string => stripIndents`
				Input:
				\`\`\`js
				${code}
				\`\`\`
			`,
			OUTPUT: (code: string): string => stripIndents`
				Output:
				\`\`\`js
				${code}
				\`\`\`
			`,
			TYPE: ``,
			TIME: ``,
			HASTEBIN: ``,
			ERRORS: {
				TOO_LONG: `Output too long, uploaded below.`,
				CODE_BLOCK: (err: Error): string => stripIndents`
					Error:
					\`\`\`xl
					${err}
					\`\`\`
				`,
			},
		},
	},
};

@injectable()
export default class<Cmd extends typeof EvalCommand> extends Command<Cmd> {
	public constructor(
		@inject(Client) public readonly client: Client,
		// @ts-expect-error allowed for eval command
		@inject(kCommands) private readonly commands: Map<string, Command>,
	) {
		super();
	}

	private _clean(text: string): any {
		const replacedText = text
			.replaceAll('`', `\`${String.fromCodePoint(8_203)}`)
			.replaceAll('@', `@${String.fromCodePoint(8_203)}`);

		return replacedText.replaceAll(new RegExp(this.client.token!, 'gi'), SENSITIVE_PATTERN_REPLACEMENT);
	}

	public override async chatInput(interaction: InteractionParam, args: ArgsParam<Cmd>): Promise<void> {
		await interaction.deferReply({ ephemeral: args.hide ?? true });

		if (![interaction.user?.id, interaction.member?.user.id].includes(process.env.OWNER_ID!)) throw new Error('no');

		let evaled: any;
		try {
			const hrStart = process.hrtime();
			evaled = eval(args.code); // eslint-disable-line no-eval

			// eslint-disable-next-line no-eq-null, eqeqeq
			if (evaled != null && typeof evaled.then === 'function') evaled = await evaled;
			const hrStop = process.hrtime(hrStart);

			let response = '';
			response += MESSAGES.COMMANDS.EVAL.INPUT(args.code);
			response += MESSAGES.COMMANDS.EVAL.OUTPUT(this._clean(inspect(evaled, { depth: 0 })));
			response += `• Type: \`${typeof evaled}\``;
			response += ` • time taken: \`${(hrStop[0] * 1e9 + hrStop[1]) / 1e6}ms\``;

			if (response.length > 2_000) {
				return void interaction.editReply({
					content: MESSAGES.COMMANDS.EVAL.ERRORS.TOO_LONG,
					files: [
						{
							attachment: Buffer.from(response),
							name: 'output.txt',
						},
					],
				});
			}

			if (response.length > 0) {
				await interaction.editReply(response);
			}
		} catch (error: unknown) {
			const err = error as Error;

			await interaction.editReply(
				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				MESSAGES.COMMANDS.EVAL.ERRORS.CODE_BLOCK(this._clean((err.stack ?? err).toString())),
			);
		}
	}
}
