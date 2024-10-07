const PingCommand = {
	name: 'ping',
	description: 'Ensures the bot is responding to commands.',
	contexts: [0, 1, 2],
	integration_types: [0, 1],
} as const;

export default PingCommand;
