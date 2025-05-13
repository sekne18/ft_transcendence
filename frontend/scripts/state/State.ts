export class State {
	private static instance: State;
	private state: Record<string, any> = {};
	private listeners: Record<string, Array<(state: any) => void>> = {};
	private constructor() {}

	// returns a function to unsubscribe from the listener
	public static subscribe(key: string, callback: (state: any) => void): () => void {
		if (!State.instance) {
			State.instance = new State();
		}
		if (!State.instance.listeners[key]) {
			State.instance.listeners[key] = [];
		}
		State.instance.listeners[key].push(callback);
		return () => {
			const listeners = State.instance?.listeners[key];
			if (listeners) {
				State.instance.listeners[key] = listeners.filter((listener) => listener !== callback);
			}
		}
	}

	public static setState(key: string, value: any): void {
		if (!State.instance) {
			State.instance = new State();
		}
		State.instance.state[key] = value;
		const listeners = State.instance.listeners[key];
		if (listeners) {
			listeners.forEach((listener) => listener(value));
		}
	}

	public static getState(key: string): any {
		if (!State.instance) {
			State.instance = new State();
		}
		return State.instance.state[key];
	}

	public static clearState(key: string): void {
		if (!State.instance) {
			return;
		}
		delete State.instance.state[key];
		const listeners = State.instance.listeners[key];
		if (listeners) {
			listeners.forEach((listener) => listener(undefined));
		}
		delete State.instance.listeners[key];
	}
};