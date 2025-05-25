export const networkConfig: {
	wsScheme: "wss" | "ws",
	httpScheme: "https" | "http",
	host: string,
} =
// {
// 	wsScheme: "wss", // "ws" in dev, "wss" in prod
// 	httpScheme: "https", // "http" in dev, "https" in prod
// 	host: window.location.host, // "localhost:3000" in dev, window.location.host in prod
// }
{
	wsScheme: "ws", // "ws" in dev, "wss" in prod
	httpScheme: "http", // "http" in dev, "https" in prod
	host: "localhost:3000", // "localhost:3000" in dev, window.location.host in prod
}