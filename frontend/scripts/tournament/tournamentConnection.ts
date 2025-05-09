// TournamentConnection.ts

class TournamentConnection {
    private socket: WebSocket;

    constructor(serverUrl: string, private handleUpdate: (data: any) => void) {
        this.socket = new WebSocket(serverUrl);

        this.socket.addEventListener("open", () => {
            console.log("Connected to WebSocket server!");
        });

        this.socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            this.handleUpdate(data);
        });

        this.socket.addEventListener("close", () => {
            console.log("Disconnected from WebSocket server.");
        });

        this.socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });
    }

    public sendMessage(type: string, data: any) {
        const message = JSON.stringify({ type, ...data });
        this.socket.send(message);
    }

    public joinTournament(player: any) {
        this.sendMessage("join_tournament", { player });
    }

    public startTournament(matches: any[]) {
        this.sendMessage("tournament_started", { matches });
    }

    public updateMatchStatus(matchId: string, status: string, winner: string | null = null) {
        this.sendMessage("match_status", { matchId, status, winner });
    }

    public closeConnection() {
        this.socket.close();
    }
}

export default TournamentConnection;
