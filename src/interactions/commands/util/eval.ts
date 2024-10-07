import { ApplicationCommandOptionType } from 'discord-api-types/v10';

const EvalCommand = {
	name: 'eval',
	description: 'Evaluate JavaScript code.',
	options: [
		{
			name: 'code',
			description: 'The code to execute',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'hide',
			description: 'hide the command output from the outside world',
			type: ApplicationCommandOptionType.Boolean,
		},
	],
	contexts: [0, 1, 2],
	integration_types: [0, 1],
} as const;

export default EvalCommand;
