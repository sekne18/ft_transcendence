export const networkConfig: {
	wsScheme: "wss" | "ws",
	httpScheme: "https" | "http",
	host: string,
} = {
	wsScheme: "wss", // "ws" in dev, "wss" in prod
	httpScheme: "https", // "http" in dev, "https" in prod
	host: "a1-r1-p7.s19.be:8443", // "localhost:3000" in dev, window.location.host in prod
}