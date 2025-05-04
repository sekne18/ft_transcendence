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
    leaderboard_level: 'Level',
    leaderboard_wins: 'Wins',
    leaderboard_win_rate: 'Win Rate',
    leaderboard_score: 'Score',
    leaderboard_desc: "See who's dominating the Pong arena",
    
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
    leaderboard_level: 'Niveau',
    leaderboard_wins: 'Overwinningen',
    leaderboard_win_rate: 'Winstpercentage',
    leaderboard_score: 'Score',
    leaderboard_desc: "Bekijk wie de Pong-arena domineert",
    leaderboard_title: 'Leiderschapsbord',
    leaderboard_rank: 'Rang',
    leaderboard_player: 'Speler',
    
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
    
    // Leaderboard item
    leaderboard_level: 'Stopnja',
    leaderboard_wins: 'Zmage',
    leaderboard_win_rate: 'Stopnja zmag',
    leaderboard_score: 'Točke',
    leaderboard_desc: "Poglej, kdo dominira v Pong areni",
    leaderboard_title: 'Lestvica',
    leaderboard_rank: 'Uvrstitev',
    leaderboard_player: 'Igralec',
    
    // Chat items
    chat_title: 'Pogovor',
    chat_send: 'Pošlji'
  }
};
