const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const db = require('./database');
const gameLogic = require('./gameLogic');
const shop = require('./shop');
const banking = require('./banking');

const bot = new Telegraf(config.BOT_TOKEN);

// خريطة لتخزين حالة الألعاب المؤقتة
const gameStates = new Map();
const userStates = new Map();

// معالج الأخطاء
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('حدث خطأ، يرجى المحاولة مرة أخرى.');
});

// أمر البداية
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;

  // إنشاء المستخدم في قاعدة البيانات
  await db.createUser(userId, username, firstName);

  // التحقق من الإقصاء
  const user = await db.getUser(userId);
  if (user && user.is_banned) {
    return ctx.reply('أنت مقصي اتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o');
  }

  const welcomeText = `🕵️‍♂️ لعبة Spyfall هي لعبة اجتماعية قصيرة (3–30 لاعبين)
يجتهد فيها "الجاسوس" في تخمين مكان سري،
بينما يحاول الآخرون كشفه بأسئلة ذكية،
أو ينتصر الجاسوس إذا ظل خفيًا أو خمن المكان.

🔗 رابط المجموعة: ${config.GROUP_INVITE_LINK}
👨‍💻 المطور: @${config.DEVELOPER_ID}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔘 اضغط هنا باه تفهم', 'show_rules')],
    [Markup.button.url('اضفني لمجموعتك لبدأ اللعبة', `http://t.me/${config.BOT_USERNAME}?startgroup=new`)]
  ]);

  try {
    await ctx.replyWithPhoto(config.IMAGES.WELCOME, {
      caption: welcomeText,
      reply_markup: keyboard.reply_markup
    });
  } catch (error) {
    await ctx.reply(welcomeText, keyboard);
  }
});

// إظهار القوانين
bot.action('show_rules', async (ctx) => {
  const rulesText = `📜 **قواعد اللعبة:**

[●] ممنوع شخص يتسأل مرتين ورا بعض
[●] أي لاعب يقدر دايما يبدأ تصويت على لاعب تاني شك فيه، والأغلبية تفوز
[●] لو الأغلبية شكوا في لاعب، حقهم يعرفوا كان جاسوس ولا لأ، ولو كان جاسوس يطرد
[●] لا يُحتسب صوت أي لاعب خرج بالتصويت حتى لو ما كانش جاسوس
[●] كل دور هيكون فيه عدد فرص حسب عدد اللعيبة، والفرصة بتضيع مع كل لعيب بيطرد وهو مش جاسوس
[●] لو الوقت خلص قبل ما الجواسيس كلهم يتطردوا، 🕒 الجواسيس يكسبوا
[●] محدش عارف مين جاسوس ومين لأ، فكر كويس وخلي أسئلتك ذكية ومش بتفضح المكان أو الأكلة
[●] لو الجاسوس عرف المكان أو الأكلة، ممكن يوقف الدور في أي وقت ويعلن تخمينه:
  – لو صح ➡️ تنتهي الدور بفوز الجواسيس
  – لو غلط ➡️ يطرد والدور يكمل عادي
[●] هدف الجواسيس: إنهم ما يتعرفوش ويعرفوا المكان أو الأكلة قبل ما الوقت يخلص
[●] هدف الباقي: إكتشاف كل الجواسيس قبل ما الوقت يخلص
[●] الجاسوس هي لعبة لـ 3 أو أكثر، مكونة من فرقتين:
  – فريق يعرف المكان/الاكلـة
  – فريق جواسيس مش عارفينه`;

  await ctx.answerCbQuery();
  await ctx.reply(rulesText, { parse_mode: 'Markdown' });
});

// معالج إضافة البوت للمجموعة
bot.on('my_chat_member', async (ctx) => {
  const chatMember = ctx.update.my_chat_member;
  const chat = ctx.chat;

  if (chatMember.new_chat_member.status === 'administrator') {
    await ctx.reply('👋 شكرًا لإضافتي!\nاضغط على /newgame للبدء.');
  } else if (chatMember.new_chat_member.status === 'member') {
    await ctx.reply('لا استطيع إكمال اللعبة إلا عند رفعي أدمن');
  }
});

// أمر اللعبة الجديدة
bot.command('newgame', async (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('هذا الأمر للمجموعات فقط');
  }

  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  // التحقق من صلاحيات البوت
  const botMember = await ctx.getChatMember(ctx.botInfo.id);
  if (botMember.status !== 'administrator') {
    return ctx.reply('لا استطيع إكمال اللعبة إلا عند رفعي أدمن');
  }

  // التحقق من الإقصاء
  const user = await db.getUser(userId);
  if (user && user.is_banned) {
    return ctx.reply('أنت مقصي اتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o');
  }

  // التحقق من وجود لعبة نشطة
  const activeGame = gameLogic.getGameStatus(chatId);
  if (activeGame) {
    return ctx.reply('لا يمكن فاللعبة جارية');
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔵 أبدا اللعبة', 'start_game')],
    [Markup.button.callback('🟠 كيفاه تتعلب هذي اللعبة', 'game_rules')],
    [Markup.button.url('🟣 انضم للقناة للمزيد من المتعة', config.GROUP_INVITE_LINK)]
  ]);

  await ctx.reply('🤔 حاب تبدا تلعب؟', keyboard);
});

// بدء اللعبة - الكود المُصحح
bot.action('start_game', async (ctx) => {
  const chatId = ctx.chat.id;
  
  await ctx.answerCbQuery();

  // إنشاء اللعبة فعلياً في النظام - هذا هو الجزء المفقود!
  const gameData = {
    id: require('uuid').v4(),
    chatId: chatId,
    players: [],
    status: 'waiting',
    startTime: Date.now()
  };
  
  // حفظ اللعبة في الذاكرة
  gameLogic.activeGames.set(chatId, gameData);

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🟢 انضم للعبة', 'join_game')]
  ]);

  await ctx.editMessageText('🎮 اللعبة جاهزة! انضموا الآن:', keyboard);

  // بدء مؤقت الانضمام (1.5 دقيقة)
  setTimeout(async () => {
    const game = gameLogic.getGameStatus(chatId);
    if (game && game.players.length >= 3) {
      const choiceKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📦 اشياء', 'choose_items')],
        [Markup.button.callback('📍 اماكن', 'choose_locations')]
      ]);

      await ctx.reply('⏰ انتهت مدة الانضمام!\n\n🎯 واش حابين؟', choiceKeyboard);
    } else {
      await ctx.reply('❌ لم ينضم عدد كافي من اللاعبين (يجب 3 على الأقل)');
      await gameLogic.cancelGame(chatId);
    }
  }, config.GAME_SETTINGS.JOIN_TIMEOUT);
});


// قواعد اللعبة
bot.action('game_rules', async (ctx) => {
  const rulesText = `📜 **قواعد اللعبة:**

[●] ممنوع شخص يتسأل مرتين ورا بعض
[●] أي لاعب يقدر دايما يبدأ تصويت على لاعب تاني شك فيه، والأغلبية تفوز
[●] لو الأغلبية شكوا في لاعب، حقهم يعرفوا كان جاسوس ولا لأ، ولو كان جاسوس يطرد
[●] لا يُحتسب صوت أي لاعب خرج بالتصويت حتى لو ما كانش جاسوس
[●] كل دور هيكون فيه عدد فرص حسب عدد اللعيبة، والفرصة بتضيع مع كل لعيب بيطرد وهو مش جاسوس
[●] لو الوقت خلص قبل ما الجواسيس كلهم يتطردوا، 🕒 الجواسيس يكسبوا
[●] محدش عارف مين جاسوس ومين لأ، فكر كويس وخلي أسئلتك ذكية ومش بتفضح المكان أو الأكلة
[●] لو الجاسوس عرف المكان أو الأكلة، ممكن يوقف الدور في أي وقت ويعلن تخمينه:
  – لو صح ➡️ تنتهي الدور بفوز الجواسيس
  – لو غلط ➡️ يطرد والدور يكمل عادي
[●] هدف الجواسيس: إنهم ما يتعرفوش ويعرفوا المكان أو الأكلة قبل ما الوقت يخلص
[●] هدف الباقي: إكتشاف كل الجواسيس قبل ما الوقت يخلص
[●] الجاسوس هي لعبة لـ 3 أو أكثر، مكونة من فرقتين:
  – فريق يعرف المكان/الاكلـة
  – فريق جواسيس مش عارفينه`;

  await ctx.answerCbQuery();
  await ctx.reply(rulesText, { parse_mode: 'Markdown' });
});

// الانضمام للعبة
bot.action('join_game', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;

  await ctx.answerCbQuery();

  // التحقق من الإقصاء
  const user = await db.getUser(userId);
  if (user && user.is_banned) {
    return ctx.reply('أنت مقصي اتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o');
  }

  const result = await gameLogic.joinGame(chatId, userId, username, firstName);
  
  if (result.success) {
    await ctx.reply(`✅ انضم ${firstName} للعبة! (${result.playerCount} لاعب)`);
  } else {
    await ctx.reply(`❌ ${result.message}`);
  }
});

// اختيار نوع اللعبة
bot.action(['choose_items', 'choose_locations'], async (ctx) => {
  const chatId = ctx.chat.id;
  const gameType = ctx.match[0] === 'choose_items' ? 'اشياء' : 'اماكن';

  await ctx.answerCbQuery();

  const result = await gameLogic.startNewGame(chatId, gameType);
  if (result.success) {
    gameStates.set(chatId, {
      gameId: result.gameId,
      gameType,
      step: 'awaiting_normal_players'
    });

    await ctx.reply('📝 كم عدد الأشخاص العاديين؟\n(من 3 إلى 30)');
  } else {
    await ctx.reply(`❌ ${result.message}`);
  }
});

// معالج الرسائل النصية
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const firstName = ctx.from.first_name;

  // التحقق من الإقصاء
  const user = await db.getUser(userId);
  if (user && user.is_banned) {
    return ctx.reply('أنت مقصي اتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o');
  }

  // معالجة إعداد اللعبة
  const gameState = gameStates.get(chatId);
  if (gameState) {
    return await handleGameSetup(ctx, gameState, text);
  }

  // معالجة أوامر المتجر والبنك
  if (ctx.chat.type === 'private') {
    return await handlePrivateCommands(ctx, text);
  }

  // معالجة أمر "start" في الخاص للحصول على الدور
  if (text.toLowerCase() === 'start' && ctx.chat.type === 'private') {
    return await sendPlayerRole(ctx, userId);
  }
});

// معالج إعداد اللعبة
async function handleGameSetup(ctx, gameState, text) {
  const chatId = ctx.chat.id;
  const number = parseInt(text);

  if (isNaN(number)) {
    return ctx.reply('يرجى إدخال رقم صحيح');
  }

  if (gameState.step === 'awaiting_normal_players') {
    if (number < 3 || number > 30) {
      return ctx.reply('يجب أن يكون عدد الأشخاص العاديين من 3 إلى 30');
    }

    gameState.normalPlayers = number;
    gameState.step = 'awaiting_spies';
    await ctx.reply('📝 كم عدد الجواسيس؟\n(من 1 إلى 10)');

  } else if (gameState.step === 'awaiting_spies') {
    if (number < 1 || number > 10) {
      return ctx.reply('يجب أن يكون عدد الجواسيس من 1 إلى 10');
    }

    // التحقق من قيود الجواسيس
    const totalPlayers = gameState.normalPlayers + number;
    const maxSpies = Math.floor(totalPlayers / 3);
    
    if (number > maxSpies) {
      let message = '';
      if (totalPlayers >= 3 && totalPlayers <= 5) {
        message = 'لا يمكن ذلك يمكنك اختيار فقط جاسوس واحد';
      } else {
        message = `لا يمكن اختيار أكثر من ${maxSpies} جواسيس`;
      }
      return ctx.reply(message);
    }

    gameState.spiesCount = number;
    gameState.step = 'awaiting_duration';
    await ctx.reply('📝 كم دقيقة تريدون هذه البارتية؟\n(من 1 إلى 15)');

} else if (gameState.step === 'awaiting_duration') {
  if (number < 1 || number > 15) {
    return ctx.reply('يجب أن تكون مدة البارتية من 1 إلى 15 دقيقة');
  }

  gameState.duration = number;
  
  // التحقق من عدد اللاعبين أولاً
  const currentGame = gameLogic.getGameStatus(chatId);
  const playersJoined = currentGame ? currentGame.players.length : 0;
  const totalNeeded = gameState.normalPlayers + gameState.spiesCount;

  if (playersJoined !== totalNeeded) {
    return ctx.reply(`❌ يجب أن ينضم ${totalNeeded} لاعب بالضبط قبل بدء اللعبة\nالعدد الحالي: ${playersJoined} لاعب\nمطلوب: ${totalNeeded} لاعب`);
  }

  // حذف حالة اللعبة مرة واحدة فقط
  gameStates.delete(chatId);

  // إرسال الرسالة مرة واحدة فقط
  await ctx.reply('📨 ارسل لي كلمة start في الخاص لترى دورك');

  // إعداد اللعبة
  const result = await gameLogic.setupGame(chatId, gameState.normalPlayers, gameState.spiesCount, gameState.duration);
  if (result.success) {
    setTimeout(async () => {
      await ctx.reply('📢 صَيَّبو مدينا الأدوار، ابداو تلعبو! 🎲🕰️');
    }, 10000);
  } else {
    await ctx.reply(`❌ ${result.message}`);
  }
}


// معالج الأوامر الخاصة
async function handlePrivateCommands(ctx, text) {
  const userId = ctx.from.id;
  const userState = userStates.get(userId);

  // أوامر المتجر
  if (text.startsWith('شراء ')) {
    const parts = text.split(' ');
    if (parts.length >= 3) {
      const quantity = parseInt(parts[1]);
      const itemName = parts.slice(2).join(' ');
      
      if (!isNaN(quantity) && quantity > 0) {
        const result = await shop.buyItem(userId, itemName, quantity);
        if (result.success) {
          await ctx.reply(`${result.message}\nتبقى لديك ${result.remainingBalance.toLocaleString()} د.ج`);
        } else {
          await ctx.reply(`❌ ${result.message}`);
        }
      } else {
        await ctx.reply('يرجى إدخال كمية صحيحة');
      }
    } else {
      await ctx.reply('الصيغة: شراء [الكمية] [اسم العنصر]');
    }
    return;
  }

  if (text.startsWith('بيع ')) {
    const parts = text.split(' ');
    if (parts.length >= 3) {
      const quantity = parseInt(parts[1]);
      const itemName = parts.slice(2).join(' ');
      
      if (!isNaN(quantity) && quantity > 0) {
        const result = await shop.sellItem(userId, itemName, quantity);
        if (result.success) {
          await ctx.reply(result.message);
        } else {
          await ctx.reply(`❌ ${result.message}`);
        }
      } else {
        await ctx.reply('يرجى إدخال كمية صحيحة');
      }
    } else {
      await ctx.reply('الصيغة: بيع [الكمية] [اسم العنصر]');
    }
    return;
  }

  // أمر ممتلكاتي
  if (text === 'ممتلكاتي') {
    const items = await shop.getUserItems(userId);
    if (items.length === 0) {
      await ctx.reply('✨ لا تملك أي عناصر حالياً');
    } else {
      let message = '✨ **ممتلكاتك:**\n\n';
      items.forEach(item => {
        message += `• ${item.item_name}: ${item.quantity} قطعة\n`;
      });
      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    return;
  }

  // أمر المتجر
  if (text === 'متجر') {
    const shopMessage = shop.formatShopMessage();
    await ctx.reply(shopMessage, { parse_mode: 'Markdown' });
    return;
  }

  // أمر فتح حساب بنكي
  if (text === 'حلي بونكا') {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('بدر', 'bank_badr')],
      [Markup.button.callback('الهلال', 'bank_hilal')],
      [Markup.button.callback('أويحي', 'bank_ouyahia')]
    ]);

    await ctx.reply('🏦 اختر البونكا:', keyboard);
    return;
  }

  // أمر التحويل
  if (text.startsWith('فارسي ')) {
    const parts = text.split(' ');
    if (parts.length === 2) {
      const amount = parseInt(parts[1]);
      if (!isNaN(amount) && amount > 0) {
        userStates.set(userId, { action: 'transfer', amount });
        await ctx.reply(`💸 ارسل رقم حساب المستفيد لتحويل ${amount.toLocaleString()} د.ج`);
      } else {
        await ctx.reply('يرجى إدخال مبلغ صحيح');
      }
    } else {
      await ctx.reply('الصيغة: فارسي [المبلغ]');
    }
    return;
  }

  // معالجة حالة التحويل
  if (userState && userState.action === 'transfer') {
    const accountNumber = text.trim();
    const result = await banking.transfer(userId, accountNumber, userState.amount);
    userStates.delete(userId);
    
    if (result.success) {
      await ctx.reply(`✅ ${result.message}`);
    } else {
      await ctx.reply(`❌ ${result.message}`);
    }
    return;
  }

  // أمر الرصيد
  if (text === 'رصيدي') {
    const user = await db.getUser(userId);
    if (user) {
      await ctx.reply(`💰 رصيدك: ${user.balance.toLocaleString()} د.ج`);
      if (user.bank_account) {
        await ctx.reply(`🏦 رقم حسابك: ${user.bank_account} (${user.bank_name})`);
      }
    } else {
      await ctx.reply('❌ لم يتم العثور على حسابك');
    }
    return;
  }
}

// معالج أزرار البنك
bot.action(['bank_badr', 'bank_hilal', 'bank_ouyahia'], async (ctx) => {
  const userId = ctx.from.id;
  const bankName = ctx.match[0].replace('bank_', '');
  const bankNames = { badr: 'بدر', hilal: 'الهلال', ouyahia: 'أويحي' };

  await ctx.answerCbQuery();

  const result = await banking.createAccount(userId, bankNames[bankName]);
  if (result.success) {
    await ctx.editMessageText(`✅ ${result.message}`);
  } else {
    await ctx.editMessageText(`❌ ${result.message}`);
  }
});

// إرسال دور اللاعب
async function sendPlayerRole(ctx, userId) {
  // البحث عن اللعبة التي ينتمي إليها اللاعب
  const games = await new Promise((resolve, reject) => {
    db.db.all(
      `SELECT g.*, gp.is_spy FROM games g 
       JOIN game_players gp ON g.id = gp.game_id 
       WHERE gp.user_id = ? AND g.status = 'playing'`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  if (games.length === 0) {
    return ctx.reply('لا توجد لعبة نشطة لك حالياً');
  }

  const game = games[0];
  
  if (game.is_spy) {
    try {
      await ctx.replyWithPhoto(config.IMAGES.SPY_ROLE, {
        caption: `أنت هو الجاسوس 🕵️‍♂️\n\nاعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!`
      });
    } catch (error) {
      await ctx.reply(`أنت هو الجاسوس 🕵️‍♂️\n\nاعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!`);
    }
  } else {
    await ctx.reply(`أنت ماكش جاسوس 🚫🕵️\n\n${game.game_type === 'اماكن' ? '📍' : '📦'} ${game.game_type}: ${game.location_or_item}`);
  }
}

// معالج التصويت
bot.action(/^vote_/, async (ctx) => {
  const userId = ctx.from.id;
  const votedForId = parseInt(ctx.match[0].replace('vote_', ''));
  
  await ctx.answerCbQuery();

  // العثور على اللعبة النشطة للمستخدم
  const games = await new Promise((resolve, reject) => {
    db.db.all(
      `SELECT g.* FROM games g 
       JOIN game_players gp ON g.id = gp.game_id 
       WHERE gp.user_id = ? AND g.status = 'voting'`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  if (games.length === 0) {
    return ctx.reply('لا توجد لعبة نشطة للتصويت');
  }

  const game = games[0];
  const result = await gameLogic.vote(game.chat_id, userId, votedForId);
  
  if (result.success) {
    // إرسال إشعار في المجموعة
    await bot.telegram.sendMessage(game.chat_id, `${result.voterName} صوت لإعدام ${result.votedForName} 🗳️`);
    await ctx.reply('✅ تم تسجيل صوتك');
  } else {
    await ctx.reply(`❌ ${result.message}`);
  }
});

// أمر المطور للإقصاء
bot.command('ban', async (ctx) => {
  if (ctx.from.username !== config.DEVELOPER_ID) {
    return ctx.reply('هذا الأمر للمطور فقط');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('الاستخدام: /ban [user_id]');
  }

  const targetUserId = parseInt(args[1]);
  if (isNaN(targetUserId)) {
    return ctx.reply('يرجى إدخال معرف المستخدم صحيح');
  }

  await db.banUser(targetUserId);
  await ctx.reply(`✅ تم إقصاء المستخدم ${targetUserId}`);
});

// أمر المطور لإلغاء الإقصاء
bot.command('unban', async (ctx) => {
  if (ctx.from.username !== config.DEVELOPER_ID) {
    return ctx.reply('هذا الأمر للمطور فقط');
  }

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('الاستخدام: /unban [user_id]');
  }

  const targetUserId = parseInt(args[1]);
  if (isNaN(targetUserId)) {
    return ctx.reply('يرجى إدخال معرف المستخدم صحيح');
  }

  await new Promise((resolve, reject) => {
    db.db.run('UPDATE users SET is_banned = 0 WHERE id = ?', [targetUserId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });

  await ctx.reply(`✅ تم إلغاء إقصاء المستخدم ${targetUserId}`);
});

// بدء البوت
bot.launch().then(() => {
  console.log('🤖 البوت يعمل بنجاح!');
}).catch((err) => {
  console.error('خطأ في بدء البوت:', err);
});

// إيقاف البوت بشكل أمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
