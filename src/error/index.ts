export class CommandError extends Error {
	public constructor(message: string) {
		super(message);

		this.name = 'CommandError';
	}
}
