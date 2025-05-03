import { Chat } from "./components/chat/Chat";
import { Game } from "./components/game/Game";
import { Leaderboard } from "./components/leaderboard/Leaderboard";
import { Navbar } from "./components/navbar/Navbar";

export default function App() {
    return `
    ${Navbar()}
      
    <!-- Page Content -->
    <div class="container mx-auto p-4">
      <!-- Game Page -->
      <div id="page-game" class="page-content">
        ${Game()}
      </div>
      
      <!-- Leaderboard Page -->
      <div id="page-leaderboard" class="page-content" style="display: none;">
        ${Leaderboard()}
      </div>
      
      <!-- Chat Page -->
      <div id="page-chat" class="page-content" style="display: none;">
        ${Chat()}
      </div>
    </div>
    
    `;
  }
  