export const wsConfig: {
	scheme: "wss" | "ws",
	host: string,
} = {
	scheme: "ws", // "ws" in dev, "wss" in prod
	host: "localhost:3000", // "localhost:3000" in dev, window.location.host in prod
}