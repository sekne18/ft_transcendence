import { Game } from "./components/game/Game";
import { Navbar } from "./components/navbar/Navbar";

export default function App() {
    return `
      
      ${Navbar()}
      ${Game()}
    
    `;
  }
  