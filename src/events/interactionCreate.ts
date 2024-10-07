import type { Command } from '@yuudachi/framework';
import { transformApplicationInteraction, kCommands } from '@yuudachi/framework';
import type { Event } from '@yuudachi/framework/types';
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
} from 'discord.js';
import { ApplicationCommandType, Client, Events } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import { CommandError } from '../error/index.js';
import { logger } from '../util/logger.js';

@injectable()
export default class implements Event {
	public name = 'Interaction handling';

	public event = Events.InteractionCreate as const;

	public constructor(
		public readonly client: Client<true>,
		@inject(kCommands) public readonly commands: Map<string, Command>,
	) {}

	public execute(): void {
		this.client.on(this.event, async (interaction) => {
			if (
				!interaction.isCommand() &&
				!interaction.isUserContextMenuCommand() &&
				!interaction.isMessageContextMenuCommand() &&
				!interaction.isAutocomplete()
			) {
				return;
			}

			// replace spaces with hyphens
			// this is to make the command name consistent
			const commandName = interaction.commandName.toLowerCase();
			logger.info(
				{
					command: {
						name: commandName,
						type: interaction.type,
					},
					userId: interaction.user.id,
				},
				`Received ${interaction.isAutocomplete() ? 'autocomplete' : 'interaction'} for command ${commandName}`,
			);
			const command = this.commands.get(commandName);

			if (command) {
				try {
					if (interaction.commandType === ApplicationCommandType.ChatInput) {
						const autocomplete = interaction.isAutocomplete();
						logger.info(
							{
								command: {
									name: interaction.commandName,
									type: interaction.type,
								},
								userId: interaction.user.id,
							},
							`Executing ${autocomplete ? 'autocomplete for' : 'chat input'} command ${
								interaction.commandName
							}`,
						);

						if (autocomplete) {
							await command.autocomplete(
								interaction as AutocompleteInteraction<'cached'>,
								transformApplicationInteraction(interaction.options.data),
								interaction.locale,
							);
						} else {
							await command.chatInput(
								interaction as ChatInputCommandInteraction<'cached'>,
								transformApplicationInteraction(interaction.options.data),
								interaction.locale,
							);
						}
					} else if (interaction.commandType === ApplicationCommandType.Message) {
						logger.info(
							{
								command: {
									name: interaction.commandName,
									type: interaction.type,
								},
								userId: interaction.user.id,
							},
							`Executing message command ${interaction.commandName}`,
						);

						await command.messageContext(
							interaction as MessageContextMenuCommandInteraction<'cached'>,
							transformApplicationInteraction(interaction.options.data),
							interaction.locale,
						);
					}
				} catch (error) {
					const isCommandError = error instanceof CommandError;
					const err = error as Error;

					if (isCommandError) logger.warn(err, err.message);
					else logger.error(err, err.message);

					if (interaction.isAutocomplete()) return;

					try {
						if (!interaction.deferred && !interaction.replied) {
							logger.warn(
								{
									command: {
										name: interaction.commandName,
										type: interaction.type,
									},
									userId: interaction.user.id,
								},
								'Command interaction has not been deferred before throwing',
							);
							await interaction.deferReply({ ephemeral: true });
						}

						await interaction.editReply({
							content: err.message,
							components: [],
						});
					} catch (error) {
						const sub = error as Error;
						logger.error(sub, sub.message);
					}
				}
			}
		});
	}
}
