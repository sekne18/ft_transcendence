// will contain classes for processing input
// and converting it to game actions

export class InputController {
	private input: { left: number; right: number };
	private position: { left: number; right: number };

	constructor() {
		this.input = { left: 0, right: 0 };
		this.position = { left: 0, right: 0 };
	}

	

	public getInput(): { left: number; right: number } {
		return this.input;
	}

	public updateInput(): void {
};