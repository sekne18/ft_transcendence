import { Chat } from "./scripts/components/chat/Chat";
import { Game } from "./scripts/components/game/Game";
import { Leaderboard } from "./scripts/components/leaderboard/Leaderboard";
import { Navbar } from "./scripts/components/navbar/Navbar";

export default function App() {
    return `
    ${Navbar()}
      
    <!-- Page Content -->
    <div class="container mx-auto p-4 h-full">
      <!-- Game Page -->
      <div id="page-game" class="page-content h-full flex items-center justify-center">
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
  