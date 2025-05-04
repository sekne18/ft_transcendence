type LanguageMap = Record<string, string>;

export const translations: Record<string, LanguageMap> = {
  en: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Play now',
    nav_leaderboard: 'Leaderboard',
    nav_chat: 'Chat',
    
    // Game items
    game_start: 'Start Game',
    game_score: 'Score',
    game_lives: 'Lives',
    
    // Leaderboard items
    leaderboard_title: 'Leaderboard',
    leaderboard_rank: 'Rank',
    leaderboard_player: 'Player',
    leaderboard_score: 'Score',
    
    // Chat items
    chat_title: 'Chat',
    chat_send: 'Send'
  },
  nl: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Speel nu',
    nav_leaderboard: 'Leiderschapsbord',
    nav_chat: 'Spreek',
    
    // Game items
    game_start: 'Start Spel',
    game_score: 'Score',
    game_lives: 'Levens',
    
    // Leaderboard items
    leaderboard_title: 'Leiderschapsbord',
    leaderboard_rank: 'Rang',
    leaderboard_player: 'Speler',
    leaderboard_score: 'Score',
    
    // Chat items
    chat_title: 'Spreek',
    chat_send: 'Stuur'
  },
  sl: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Igraj',
    nav_leaderboard: 'Lestvica',
    nav_chat: 'Pogovor',
    
    // Game items
    game_start: 'Začni igro',
    game_score: 'Rezultat',
    game_lives: 'Življenja',
    
    // Leaderboard items
    leaderboard_title: 'Lestvica',
    leaderboard_rank: 'Uvrstitev',
    leaderboard_player: 'Igralec',
    leaderboard_score: 'Točke',
    
    // Chat items
    chat_title: 'Pogovor',
    chat_send: 'Pošlji'
  }
};
