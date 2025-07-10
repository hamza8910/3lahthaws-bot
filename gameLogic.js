const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const config = require('./config');

class GameLogic {
  constructor() {
    this.activeGames = new Map();
    this.gameTimers = new Map();
    this.joinTimers = new Map();
    
// قائمة الأماكن - 60 عنصر
this.locations = [
  "مدرسة🏫", "جامعة🎓", "مستشفى🏥", "مطعم🍽️", 
  "مقهى☕", "سوق🛒", "مسجد🕌", "حديقة🌳",
  "ملعب⚽", "مكتبة📚", "بنك🏦", "صيدلية💊",
  "فندق🏨", "مطار✈️", "محطة قطار🚉", "سينما🎬",
  "مول🛍️", "مخبز🍞", "صالون💇", "ورشة🔧",
  "مكتب🏢", "منزل🏠", "شاطئ🏖️", "جبل⛰️",
  "غابة🌲", "ميناء⚓", "قلعة🏰", "متحف🏛️",
  "مزرعة🚜", "مصنع🏭", "مكتبة وطنية📚", "مركز شباب🏠", 
  "مسرح🎭", "نادي ليلي💃", "مدينة ملاهي🎢", "أكواريوم🐠", 
  "مركز اجتماعي🏠", "مركز شرطة🚔", "مركز بريد📮", "مطار مروحيات🚁", 
  "مركز أبحاث🧪", "مركز ابتكار💡", "مركز بيانات🖥️", "مركز اتصالات📞", 
  "مركز أمن سيبراني🛡️", "مركز تحكم جوي🛩️", "مركز إعادة تأهيل♿", "مركز لقاح💉", 
  "مركز توحد🧩", "مركز لغات🈳", "مركز دعم مدرسي🧑‍🏫", "مركز أيتام👶", 
  "مركز مسنين🧓", "مركز استشارات🗣️", "مركز ثقافة🏛️", "مركز تسوق إلكتروني💻", 
  "مركز لوجستي🚚", "مركز توزيع🚛", "مركز ابتكار رقمي📱", "مركز روبوتات🤖"
];
 
 // قائمة الأشياء - 60 عنصر
this.items = [
  "كتاب📖", "قلم✒️", "هاتف📱", "مفتاح🔑",
  "كوب☕", "حقيبة👝", "ساعة⌚", "نظارة👓",
  "كرة⚽", "ماء💧", "طعام🍽️", "دواء💊",
  "ملابس👕", "حذاء👞", "عطر🧴", "زهور🌹",
  "صورة🖼️", "سيارة🚗", "دراجة🚲", "قارب⛵",
  "طائرة✈️", "كاميرا📷", "موسيقى🎵", "لعبة🧸",
  "مجوهرات💍", "ساعة⌚", "مظلة☂️", "مفكرة📓",
  "قهوة☕", "شاي🍵", "كتاب قديم📜", "مصحف📖", 
  "مسبحة📿", "خنجر🗡️", "سيف⚔️", "درع🛡️", 
  "بندقية🔫", "خوذة🪖", "حذاء رياضي👟", "حقيبة ظهر🎒", 
  "مظلة شمسية🧢", "نظارة شمسية🕶️", "ساعة يد⌚", "محفظة👛", 
  "حزام🧢", "قبعة🎩", "قفازات🧤", "حذاء جلدي👞", 
  "جوارب🧦", "دراجة رباعية🏎️", "شاحنة🚚", "رافعة🏗️", 
  "حافلة مدرسية🚌", "سيارة إسعاف🚑", "سيارة إطفاء🚒", "زورق🚤", 
  "طائرة شراعية🪂", "مظلي🪂", "مظلة⛱️", "مظلة مطر☔"
];
}

  async startNewGame(chatId, gameType) {
    const existingGame = await db.getActiveGame(chatId);
    if (existingGame) {
      return { success: false, message: 'لا يمكن بداية لعبة جديدة حتى تكمل البارتية' };
    }

    const gameId = uuidv4();
    await db.createGame(gameId, chatId, gameType);
    
    this.activeGames.set(chatId, {
      id: gameId,
      type: gameType,
      players: [],
      status: 'waiting',
      startTime: Date.now()
    });

    return { success: true, gameId };
  }

  async joinGame(chatId, userId, username, firstName) {
    const game = this.activeGames.get(chatId);
    if (!game) {
      return { success: false, message: 'لا توجد لعبة متاحة للانضمام' };
    }

    if (game.players.find(p => p.id === userId)) {
      return { success: false, message: 'أنت مشترك بالفعل في اللعبة' };
    }

    if (game.players.length >= config.GAME_SETTINGS.MAX_PLAYERS) {
      return { success: false, message: 'اللعبة ممتلئة' };
    }

    // إنشاء المستخدم في قاعدة البيانات إذا لم يكن موجوداً
    await db.createUser(userId, username, firstName);

    // التحقق من الإقصاء
    const user = await db.getUser(userId);
    if (user && user.is_banned) {
      return { success: false, message: 'أنت مقصي اتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o' };
    }

    game.players.push({
      id: userId,
      username,
      firstName,
      isSpy: false,
      isAlive: true
    });

    await db.addPlayerToGame(game.id, userId);
    
    return { success: true, playerCount: game.players.length };
  }

  async setupGame(chatId, normalPlayers, spiesCount, gameDuration) {
    const game = this.activeGames.get(chatId);
    if (!game) {
      return { success: false, message: 'لا توجد لعبة نشطة' };
    }

    const totalPlayers = normalPlayers + spiesCount;
    if (game.players.length !== totalPlayers) {
      return { success: false, message: `يجب أن يكون عدد اللاعبين ${totalPlayers}` };
    }

    // التحقق من قيود الجواسيس
    const maxSpies = Math.floor(game.players.length / 3);
    if (spiesCount > maxSpies) {
      let message = '';
      if (game.players.length >= 3 && game.players.length <= 5) {
        message = 'لا يمكن ذلك يمكنك اختيار فقط جاسوس واحد';
      } else {
        message = `لا يمكن اختيار أكثر من ${maxSpies} جواسيس`;
      }
      return { success: false, message };
    }

    // اختيار الموقع/الشيء عشوائياً
    const items = game.type === 'اماكن' ? this.locations : this.items;
    const selectedItem = items[Math.floor(Math.random() * items.length)];

    // توزيع الأدوار
    const shuffledPlayers = [...game.players].sort(() => Math.random() - 0.5);
    for (let i = 0; i < spiesCount; i++) {
      shuffledPlayers[i].isSpy = true;
    }

    // تحديث قاعدة البيانات
    await db.setGameLocation(game.id, selectedItem, spiesCount, gameDuration);
    await db.updateGameStatus(game.id, 'playing');

    for (const player of shuffledPlayers) {
      await db.addPlayerToGame(game.id, player.id, player.isSpy);
    }

    game.status = 'playing';
    game.selectedItem = selectedItem;
    game.spiesCount = spiesCount;
    game.gameDuration = gameDuration;
    game.players = shuffledPlayers;

    // بدء مؤقت اللعبة
    this.startGameTimer(chatId, gameDuration);

    return { success: true, selectedItem };
  }

  startGameTimer(chatId, duration) {
    const game = this.activeGames.get(chatId);
    if (!game) return;

    const timer = setTimeout(() => {
      this.startVoting(chatId);
    }, (duration * 60 * 1000) - config.GAME_SETTINGS.VOTE_TIMEOUT);

    this.gameTimers.set(chatId, timer);
  }

  async startVoting(chatId) {
    const game = this.activeGames.get(chatId);
    if (!game) return;

    game.status = 'voting';
    await db.updateGameStatus(game.id, 'voting');

    // بدء مؤقت التصويت
    const voteTimer = setTimeout(() => {
      this.endGame(chatId);
    }, config.GAME_SETTINGS.VOTE_TIMEOUT);

    this.gameTimers.set(chatId + '_vote', voteTimer);

    return { success: true };
  }

  async vote(chatId, voterId, votedForId) {
    const game = this.activeGames.get(chatId);
    if (!game || game.status !== 'voting') {
      return { success: false, message: 'لا يمكن التصويت الآن' };
    }

    const voter = game.players.find(p => p.id === voterId);
    const votedFor = game.players.find(p => p.id === votedForId);

    if (!voter || !votedFor) {
      return { success: false, message: 'لاعب غير موجود' };
    }

    if (!voter.isAlive) {
      return { success: false, message: 'لا يمكن للاعبين المقصيين التصويت' };
    }

    await db.addVote(game.id, voterId, votedForId);
    
    return { success: true, voterName: voter.firstName, votedForName: votedFor.firstName };
  }

  async endGame(chatId) {
    const game = this.activeGames.get(chatId);
    if (!game) return;

    // إيقاف المؤقتات
    if (this.gameTimers.has(chatId)) {
      clearTimeout(this.gameTimers.get(chatId));
      this.gameTimers.delete(chatId);
    }
    if (this.gameTimers.has(chatId + '_vote')) {
      clearTimeout(this.gameTimers.get(chatId + '_vote'));
      this.gameTimers.delete(chatId + '_vote');
    }

    // حساب النتائج
    const votes = await db.getVotes(game.id);
    const voteCounts = new Map();
    
    votes.forEach(vote => {
      voteCounts.set(vote.voted_for_id, vote.vote_count);
    });

    let maxVotes = 0;
    let mostVotedPlayer = null;
    
    for (const [playerId, voteCount] of voteCounts) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        mostVotedPlayer = game.players.find(p => p.id === playerId);
      }
    }

    let spiesWon = true;
    let results = {
      gameEnded: true,
      selectedItem: game.selectedItem,
      players: game.players,
      mostVotedPlayer,
      maxVotes
    };

    if (mostVotedPlayer && maxVotes >= Math.ceil(game.players.length / 2)) {
      if (mostVotedPlayer.isSpy) {
        spiesWon = false;
        results.message = 'فاز اللاعبون! 🎊';
        results.video = config.VIDEOS.PLAYERS_WIN;
        
        // إضافة الجوائز للاعبين العاديين
        for (const player of game.players) {
          if (!player.isSpy) {
            await db.updateUserBalance(player.id, config.REWARDS.PLAYER_WIN);
          }
        }
      } else {
        results.message = 'فاز الجاسوس! 🎉';
        results.video = config.VIDEOS.SPY_WIN;
        
        // إضافة الجوائز للجواسيس
        for (const player of game.players) {
          if (player.isSpy) {
            await db.updateUserBalance(player.id, config.REWARDS.SPY_WIN);
          }
        }
      }
    } else {
      results.message = 'فاز الجاسوس! 🎉';
      results.video = config.VIDEOS.SPY_WIN;
      
      // إضافة الجوائز للجواسيس
      for (const player of game.players) {
        if (player.isSpy) {
          await db.updateUserBalance(player.id, config.REWARDS.SPY_WIN);
        }
      }
    }

    results.spiesWon = spiesWon;

    // إنهاء اللعبة
    await db.updateGameStatus(game.id, 'ended');
    this.activeGames.delete(chatId);

    return results;
  }

  getGameStatus(chatId) {
    return this.activeGames.get(chatId);
  }

  async cancelGame(chatId) {
    const game = this.activeGames.get(chatId);
    if (!game) return false;

    // إيقاف المؤقتات
    if (this.gameTimers.has(chatId)) {
      clearTimeout(this.gameTimers.get(chatId));
      this.gameTimers.delete(chatId);
    }
    if (this.joinTimers.has(chatId)) {
      clearTimeout(this.joinTimers.get(chatId));
      this.joinTimers.delete(chatId);
    }

    await db.updateGameStatus(game.id, 'cancelled');
    this.activeGames.delete(chatId);
    return true;
  }
}

module.exports = new GameLogic();
