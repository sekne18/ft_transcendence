type LanguageMap = Record<string, string>;

export const translations: Record<string, LanguageMap> = {
  en: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Play now',
    nav_leaderboard: 'Leaderboard',
    nav_chat: 'Chat',
    nav_tournament: 'Tournament',
    nav_friends: 'Friends',
    nav_logout: 'Logout',
    nav_my_stats: 'My Stats',
    nav_profile: 'Profile',

    // Game items
    game_player: 'Player',
    game_opponent: 'Opponent',
    game_play_again: 'Play Again',
    game_start: 'Start Game',
    game_score: 'Score',
    game_lives: 'Lives',

    // Leaderboard items
    leaderboard_title: 'Leaderboard',
    leaderboard_rank: 'Rank',
    leaderboard_player: 'Player',
    leaderboard_level: 'Level',
    leaderboard_wins: 'Wins',
    leaderboard_losses: 'Losses',
    leaderboard_win_rate: 'Win Rate',
    leaderboard_score: 'Score',
    leaderboard_desc: "See who's dominating the Pong arena",

    // Profile items
    statistics_tab: 'Statistics',
    edit_profile_btn: 'Edit Profile',
    recent_matches: 'Recent Matches',
    performance: 'Performance',
    win_rate: 'Win Rate',
    pending_btn: 'Pending',
    avg_score: 'Average Score',
    longest_streak: 'Longest Win Streak',
    add_friend_btn: 'Add Friend',
    remove_friend_btn: 'Remove Friend',
    block_btn: 'Block',
    unblock_btn: 'Unblock',
    chat_btn: 'Chat',
    profile_versus: 'Match vs',
    profile_streak_games: 'games',

    // Edit proifle
    change_avatar_btn: 'Change Avatar',
    edit_basic_section: 'Basic Information',
    edit_display_name: 'Display Name',
    edit_username: 'Username',
    edit_email: 'Email',
    edit_change_pass: 'Change Password',
    edit_conf_new_pass: 'Confirm New Password',
    edit_current_pass: 'Current Password',
    edit_new_pass: 'New Password',
    edit_security: 'Security',
    edit_2fa: 'Two-Factor Authentication',
    edit_2fa_desc: 'Add an extra layer of security to your account.',
    edit_cancel_btn: 'Cancel',
    edit_save_btn: 'Save Changes',

    // 2FA modal
    twoFA_title: 'Set Up Two-Factor Authentication',
    twoFA_desc: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)',
    twoFA_verif_code: 'Enter the verification code from your authenticator app:',
    twoFA_enter_code: 'Enter this code manually in your authenticator app:',
    twoFA_enable_btn: 'Verify & Enable',

    // Chat items
    chat_title: 'Chat',
    chat_send: 'Send',
    chat_placeholder: 'Type a message...',

    // Tab items
    tab_global: 'Global',
    tab_weekly: 'Weekly',
    tab_friends: 'Friends',

    // Tournament items
    tournament_title: 'Tournament',
    tournament_description: 'Compete in tournaments with 6 players',
    tournament_players_joined: 'Players joined',
    tournament_join: 'Join Tournament',
    tournament_waiting: 'Waiting for players...',

    // Friendslist items
    friendslist_title: 'Friends',
    friendslist_desc: 'Manage friends and connections',
    friendslist_all_friends: 'All Friends',
    friendslist_online: 'Online',
    friendslist_pending: 'Pending',
    friendslist_blocked: 'Blocked',
    friendslist_search: 'Search friends...',
    friendslist_no_friends: 'No friends found',
    friendslist_no_users: 'No users found',
    friendslist_showing_users: 'Showing all users'
  },
  nl: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Speel nu',
    nav_leaderboard: 'Leiderschapsbord',
    nav_chat: 'Spreek',
    nav_tournament: 'Toernooi',
    nav_friends: 'Vrienden',
    nav_logout: 'Uitloggen',
    nav_my_stats: 'Mijn Statistieken',
    nav_profile: 'Profiel',

    // Game items
    game_player: 'Speler',
    game_opponent: 'Tegenstander',
    game_play_again: 'Speel Opnieuw',
    game_start: 'Start Spel',
    game_score: 'Score',
    game_lives: 'Levens',

    // Leaderboard items
    leaderboard_level: 'Niveau',
    leaderboard_wins: 'Overwinningen',
    leaderboard_losses: 'Ondergangen',
    leaderboard_win_rate: 'Winstpercentage',
    leaderboard_score: 'Score',
    leaderboard_desc: "Bekijk wie de Pong-arena domineert",
    leaderboard_title: 'Leiderschapsbord',
    leaderboard_rank: 'Rang',
    leaderboard_player: 'Speler',

    // Chat items
    chat_title: 'Spreek',
    chat_send: 'Stuur',
    chat_placeholder: 'Typ een bericht...',

    // Profile items
    statistics_tab: 'Statistieken',
    edit_profile_btn: 'Profiel Bewerken',
    recent_matches: 'Recente Wedstrijden',
    performance: 'Prestatie',
    win_rate: 'Winstpercentage',
    avg_score: 'Gemiddelde Score',
    longest_streak: 'Langste Win Streak',
    add_friend_btn: 'Vriend Toevoegen',
    remove_friend_btn: 'Verwijder Vriend',
    block_btn: 'Blokkeer',
    unblock_btn: 'Deblokkeer',
    chat_btn: 'Spreek',
    user_games: 'Spellen',
    user_wins: 'Overwinningen',
    user_losses: 'Verliezen',
    profile_versus: 'Wedstrijd tegen',
    pending_btn: 'In afwachting',
    profile_streak_games: 'spellen',

    // Edit proifle
    change_avatar_btn: 'Verander Avatar',
    edit_basic_section: 'Basisinformatie',
    edit_display_name: 'Weergavenaam',
    edit_username: 'Gebruikersnaam',
    edit_email: 'E-mail',
    edit_change_pass: 'Wachtwoord Wijzigen',
    edit_conf_new_pass: 'Bevestig Nieuw Wachtwoord',
    edit_current_pass: 'Huidig Wachtwoord',
    edit_new_pass: 'Nieuw Wachtwoord',
    edit_security: 'Beveiliging',
    edit_2fa: 'Twee-Factor Authenticatie',
    edit_2fa_desc: 'Voeg een extra beveiligingslaag toe aan je account.',
    edit_cancel_btn: 'Annuleer',
    edit_save_btn: 'Wijzigingen Opslaan',

    // 2FA modal
    twoFA_title: 'Stel Twee-Factor Authenticatie In',
    twoFA_desc: 'Scan deze QR-code met je authenticator-app (Google Authenticator, Authy, enz.)',
    twoFA_verif_code: 'Voer de verificatiecode in van je authenticator-app:',
    twoFA_enter_code: 'Voer deze code handmatig in je authenticator-app in:',
    twoFA_enable_btn: 'Verifiëren & Inschakelen',

    // Tab items
    tab_global: 'Wereldwijd',
    tab_weekly: 'Wekelijks',
    tab_friends: 'Vrienden',

    // Tournament items
    tournament_title: 'Toernooi',
    tournament_description: 'Doe mee aan toernooien met 6 spelers',
    tournament_players_joined: 'Spelers zijn toegetreden',
    tournament_join: 'Doe mee aan het toernooi',
    tournament_waiting: 'Wachten op spelers...',

    // Friendslist items
    friendslist_title: 'Vrienden',
    friendslist_desc: 'Beheer vrienden en verbindingen',
    friendslist_all_friends: 'Alle Vrienden',
    friendslist_online: 'Online',
    friendslist_pending: 'In afwachting',
    friendslist_blocked: 'Geblokkeerd',
    friendslist_search: 'Zoek vrienden...',
    friendslist_no_friends: 'Geen vrienden gevonden',
    friendslist_no_users: 'Geen gebruikers gevonden',
    friendslist_showing_users: 'Toon alle gebruikers'
  },
  sl: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Igraj',
    nav_leaderboard: 'Lestvica',
    nav_chat: 'Pogovor',
    nav_tournament: 'Turnir',
    nav_friends: 'Prijatelji',
    nav_logout: 'Odjava',
    nav_my_stats: 'Moje statistike',
    nav_profile: 'Profil',

    // Game items
    game_player: 'Igralec',
    game_opponent: 'Nasprotnik',
    game_play_again: 'Igraj ponovno',
    game_start: 'Začni igro',
    game_score: 'Rezultat',
    game_lives: 'Življenja',

    // Leaderboard item
    leaderboard_level: 'Stopnja',
    leaderboard_wins: 'Zmage',
    leaderboard_losses: 'Porazi',
    leaderboard_win_rate: 'Stopnja zmag',
    leaderboard_score: 'Točke',
    leaderboard_desc: "Poglej, kdo dominira v Pong areni",
    leaderboard_title: 'Lestvica',
    leaderboard_rank: 'Uvrstitev',
    leaderboard_player: 'Igralec',

    // Chat items
    chat_title: 'Pogovor',
    chat_send: 'Pošlji',
    chat_placeholder: 'Vnesi sporočilo...',

    // Profile items
    statistics_tab: 'Statistika',
    edit_profile_btn: 'Uredi profil',
    recent_matches: 'Zadnje tekme',
    performance: 'Uspešnost',
    win_rate: 'Stopnja zmag',
    avg_score: 'Povprečen rezultat',
    longest_streak: 'Najdaljša zaporedna zmaga',
    add_friend_btn: 'Dodaj prijatelja',
    remove_friend_btn: 'Odstrani prijatelja',
    block_btn: 'Blokiraj',
    unblock_btn: 'Deblokiraj',
    chat_btn: 'Pogovor',
    user_games: 'Igre',
    user_wins: 'Zmage',
    user_losses: 'Porazi',
    profile_versus: 'Tekma proti',
    pending_btn: 'Čaka',
    profile_streak_games: 'iger',

    // Edit proifle
    change_avatar_btn: 'Spremeni avatar',
    edit_basic_section: 'Osnovne informacije',
    edit_display_name: 'Ime za prikaz',
    edit_username: 'Uporabniško ime',
    edit_email: 'E-pošta',
    edit_change_pass: 'Spremeni geslo',
    edit_conf_new_pass: 'Potrdi novo geslo',
    edit_current_pass: 'Trenutno geslo',
    edit_new_pass: 'Novo geslo',
    edit_security: 'Varnost',
    edit_2fa: 'Dvofaktorska avtentikacija',
    edit_2fa_desc: 'Dodaj dodatno plast zaščite svojemu računu.',
    edit_cancel_btn: 'Prekliči',
    edit_save_btn: 'Shrani spremembe',

    // 2FA modal
    twoFA_title: 'Nastavi dvofaktorsko avtentikacijo',
    twoFA_desc: 'Skeniraj to QR kodo s svojo aplikacijo za avtentikacijo (Google Authenticator, Authy itd.)',
    twoFA_verif_code: 'Vnesi kodo za preverjanje iz svoje aplikacije za avtentikacijo:',
    twoFA_enter_code: 'Vnesi to kodo ročno v svojo aplikacijo za avtentikacijo:',
    twoFA_enable_btn: 'Preveri in omogoči',

    // Tab items
    tab_global: 'Globalno',
    tab_weekly: 'Tedensko',
    tab_friends: 'Prijatelji',

    // Tournament items
    tournament_title: 'Turnir',
    tournament_description: 'Tekmujte v turnirjih s 6 igralci',
    tournament_players_joined: 'Igralci so se pridružili',
    tournament_join: 'Pridruži se turnirju',
    tournament_waiting: 'Čakanje na igralce...',

    // Friendslist items
    friendslist_title: 'Prijatelji',
    friendslist_desc: 'Upravljaj prijatelje in povezave',
    friendslist_all_friends: 'Vsi prijatelji',
    friendslist_online: 'Spletni',
    friendslist_pending: 'Čaka',
    friendslist_blocked: 'Blokirani',
    friendslist_search: 'Išči prijatelje...',
    friendslist_no_friends: 'Noben prijatelj ni najden',
    friendslist_no_users: 'Noben uporabnik ni najden',
    friendslist_showing_users: 'Prikaži vse uporabnike'
  },
  ua: {
    // Navbar items
    nav_title: 'Pongy',
    nav_game: 'Грати',
    nav_leaderboard: 'Таблиця лідерів',
    nav_chat: 'Чат',
    nav_tournament: 'Турнір',
    nav_friends: 'Друзі',
    nav_logout: 'Вийти',
    nav_my_stats: 'Моя статистика',
    nav_profile: 'Профіль',

    // Game items
    game_player: 'Гравець',
    game_opponent: 'Суперник',
    game_play_again: 'Грати знову',
    game_start: 'Почати гру',
    game_score: 'Рахунок',
    game_lives: 'Життя',

    // Leaderboard item
    leaderboard_level: 'Рівень',
    leaderboard_wins: 'Перемоги',
    leaderboard_win_rate: 'Відсоток перемог',
    leaderboard_score: 'Очки',
    leaderboard_desc: "Дізнайся, хто домінує на арені Pong",
    leaderboard_title: 'Таблиця лідерів',
    leaderboard_rank: 'Ранг',
    leaderboard_player: 'Гравець',

    // Chat items
    chat_title: 'Чат',
    chat_send: 'Відправити',
    chat_placeholder: 'Введіть повідомлення...',

    // Profile items
    statistics_tab: 'Статистика',
    edit_profile_btn: 'Редагувати профіль',
    recent_matches: 'Останні матчі',
    performance: 'Виступ',
    win_rate: 'Відсоток перемог',
    avg_score: 'Середній рахунок',
    longest_streak: 'Найдовша серія перемог',
    add_friend_btn: 'Додати друга',
    remove_friend_btn: 'Видалити друга',
    block_btn: 'Заблокувати',
    unblock_btn: 'Розблокувати',
    chat_btn: 'Чат',
    user_games: 'Ігри',
    user_wins: 'Перемоги',
    user_losses: 'Поразки',
    profile_versus: 'Матч проти',
    pending_btn: 'В очікуванні',
    profile_streak_games: 'ігор',

    // Edit proifle
    change_avatar_btn: 'Змінити аватар',
    edit_basic_section: 'Основна інформація',
    edit_display_name: 'Ім\'я для відображення',
    edit_username: 'Ім\'я користувача',
    edit_email: 'Електронна пошта',
    edit_change_pass: 'Змінити пароль',
    edit_conf_new_pass: 'Підтвердити новий пароль',
    edit_current_pass: 'Поточний пароль',
    edit_new_pass: 'Новий пароль',
    edit_security: 'Безпека',
    edit_2fa: 'Двофакторна аутентифікація',
    edit_2fa_desc: 'Додайте додатковий рівень безпеки до свого облікового запису.',
    edit_cancel_btn: 'Скасувати',
    edit_save_btn: 'Зберегти зміни',

    // 2FA modal
    twoFA_title: 'Налаштуйте двофакторну аутентифікацію',
    twoFA_desc: 'Скануйте цей QR-код за допомогою програми аутентифікації (Google Authenticator, Authy тощо)',
    twoFA_verif_code: 'Введіть код підтвердження з програми аутентифікації:',
    twoFA_enter_code: 'Введіть цей код вручну у своїй програмі аутентифікації:',
    twoFA_enable_btn: 'Перевірити та активувати',

    // Tab items
    tab_global: 'Глобальний',
    tab_weekly: 'Тижневий',
    tab_friends: 'Друзі',

    // Tournament items
    tournament_title: 'Турнір',
    tournament_description: 'Змагайтеся у турнірах з 6 гравцями',
    tournament_players_joined: 'Гравці приєднано',
    tournament_join: 'Приєднатися до турніру',
    tournament_waiting: 'Очікування гравців...',
  }
};
