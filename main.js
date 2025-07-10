const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.js');
const database = require('./database.js');
const gameLogic = require('./gameLogic.js');
const banking = require('./banking.js');
const shop = require('./shop.js');
const fs = require('fs');
const path = require('path');

// تهيئة البوت
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// متغيرات عامة
let activeGames = new Map();
let userStates = new Map();
let bannedUsers = new Set();

// رسائل ثابتة
const GAME_RULES = `📜 **قواعد اللعبة:**
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

const WELCOME_TEXT = `🕵️‍♂️ لعبة Spyfall هي لعبة اجتماعية قصيرة (3–30 لاعبين)
يجتهد فيها "الجاسوس" في تخمين مكان سري،
بينما يحاول الآخرون كشفه بأسئلة ذكية،
أو ينتصر الجاسوس إذا ظل خفيًا أو خمن المكان.
🔗 رابط المجموعة: https://t.me/+0ipdbPwuF304OWRk
👨‍💻 المطور: @V_b_L_o`;

// =======================
// مساعدات مفيدة
// =======================

async function isBotAdmin(chatId) {
    try {
        const botInfo = await bot.getMe();
        const member = await bot.getChatMember(chatId, botInfo.id);
        return ['creator', 'administrator'].includes(member.status);
    } catch (error) {
        console.error('Error checking bot admin status:', error);
        return false;
    }
}

async function isUserAdmin(chatId, userId) {
    try {
        const member = await bot.getChatMember(chatId, userId);
        return ['creator', 'administrator'].includes(member.status);
    } catch (error) {
        return false;
    }
}

function isUserBanned(userId) {
    return bannedUsers.has(userId);
}

function logUserAction(userId, action, details = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] User ${userId}: ${action} ${details}`);
}

function safeDeleteMessage(chatId, messageId) {
    bot.deleteMessage(chatId, messageId).catch(() => {
        // تجاهل أخطاء الحذف
    });
}

async function sendTypingAction(chatId) {
    try {
        await bot.sendChatAction(chatId, 'typing');
    } catch (error) {
        // تجاهل الأخطاء
    }
}

// =======================
// أمر البداية /start
// =======================

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'المستخدم';
    
    logUserAction(userId, 'COMMAND_START');
    await sendTypingAction(chatId);
    
    // التحقق من الإقصاء
    if (isUserBanned(userId)) {
        return bot.sendMessage(chatId, `${firstName}، أنت مقصي من اللعبة 🚫\nاتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o`);
    }
    
    const welcomeKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔘 اضغط هنا باه تفهم', callback_data: 'show_rules' }
                ],
                [
                    { text: '🔘 اضفني لمجموعتك لبدأ اللعبة', url: 'http://t.me/spy_spy_bbot?startgroup=new' }
                ]
            ]
        }
    };
    
    try {
        // محاولة إرسال الصورة مع النص
        await bot.sendPhoto(chatId, 'https://pin.it/2qzWrzyQO', {
            caption: `مرحباً ${firstName}! 👋\n\n${WELCOME_TEXT}`,
            ...welcomeKeyboard,
            parse_mode: 'HTML'
        });
    } catch (error) {
        // في حالة فشل الصورة، أرسل النص فقط
        await bot.sendMessage(chatId, `مرحباً ${firstName}! 👋\n\n${WELCOME_TEXT}`, {
            ...welcomeKeyboard,
            parse_mode: 'HTML'
        });
    }
    
    // إضافة المستخدم لقاعدة البيانات
    database.addUser(userId, firstName);
});

// =======================
// معالجة النقر على الأزرار
// =======================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const firstName = query.from.first_name || 'المستخدم';
    
    logUserAction(userId, 'CALLBACK_QUERY', data);
    
    // التحقق من الإقصاء
    if (isUserBanned(userId)) {
        return bot.answerCallbackQuery(query.id, '❌ أنت مقصي من اللعبة! اتصل بالمطور @V_b_L_o', true);
    }
    
    await sendTypingAction(chatId);
    
    switch (data) {
        case 'show_rules':
            await handleShowRules(query);
            break;
            
        case 'start_new_game':
            await handleStartNewGame(query);
            break;
            
        case 'join_game':
            await handleJoinGame(query);
            break;
            
        case 'game_instructions':
            await handleGameInstructions(query);
            break;
            
        case 'select_objects':
        case 'select_places':
            await handleGameTypeSelection(query, data);
            break;
            
        default:
            if (data.startsWith('vote_')) {
                await handleVoting(query);
            } else if (data.startsWith('shop_')) {
                await shop.handleShopCallback(query, bot);
            } else if (data.startsWith('bank_')) {
                await banking.handleBankCallback(query, bot);
            }
            break;
    }
});

// =======================
// دوال معالجة الأزرار
// =======================

async function handleShowRules(query) {
    const chatId = query.message.chat.id;
    
    await bot.sendMessage(chatId, GAME_RULES, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 العودة للقائمة الرئيسية', callback_data: 'back_to_main' }]
            ]
        }
    });
    
    bot.answerCallbackQuery(query.id, '✅ تم عرض القواعد');
}

async function handleStartNewGame(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    
    // التحقق من وجود لعبة جارية
    if (activeGames.has(chatId)) {
        return bot.answerCallbackQuery(query.id, '❌ لا يمكن بداية لعبة جديدة حتى تكمل البارتية!', true);
    }
    
    // إنشاء لعبة جديدة
    const newGame = gameLogic.createNewGame(chatId, userId);
    activeGames.set(chatId, newGame);
    
    const gameKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🟢 انضم للعبة', callback_data: 'join_game' }
                ],
                [
                    { text: '🟠 كيفاه تتعلب هذي اللعبة', callback_data: 'game_instructions' }
                ],
                [
                    { text: '🟣 انضم للقناة للمزيد من المتعة', url: 'https://t.me/+0ipdbPwuF304OWRk' }
                ]
            ]
        }
    };
    
    await bot.editMessageText('🎮 **لعبة جديدة جاهزة!**\n\n⏳ مدة الانضمام: دقيقة ونصف\n👥 اللاعبين حالياً: 0', {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        ...gameKeyboard
    });
    
    // تايمر انتهاء الانضمام
    setTimeout(() => {
        proceedToGameSetup(chatId);
    }, 90000);
    
    bot.answerCallbackQuery(query.id, '✅ تم إنشاء لعبة جديدة!');
}

async function handleJoinGame(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const firstName = query.from.first_name || 'مجهول';
    
    const game = activeGames.get(chatId);
    if (!game || game.status !== 'waiting_players') {
        return bot.answerCallbackQuery(query.id, '❌ لا توجد لعبة متاحة للانضمام!', true);
    }
    
    // التحقق من الانضمام المسبق
    if (game.players.some(p => p.id === userId)) {
        return bot.answerCallbackQuery(query.id, '⚠️ أنت منضم بالفعل!', true);
    }
    
    // إضافة اللاعب
    gameLogic.addPlayer(game, { id: userId, name: firstName });
    
    // تحديث الرسالة
    await updateGameMessage(chatId, query.message.message_id, game);
    
    bot.answerCallbackQuery(query.id, `✅ مرحباً ${firstName}! تم انضمامك للعبة`);
    logUserAction(userId, 'JOINED_GAME', `Players: ${game.players.length}`);
}

async function handleGameInstructions(query) {
    const chatId = query.message.chat.id;
    
    await bot.sendMessage(chatId, GAME_RULES, {
        parse_mode: 'Markdown'
    });
    
    bot.answerCallbackQuery(query.id, '📖 تم عرض تعليمات اللعبة');
}

async function handleGameTypeSelection(query, type) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    
    const game = activeGames.get(chatId);
    if (!game || game.createdBy !== userId) {
        return bot.answerCallbackQuery(query.id, '❌ يمكن لمنشئ اللعبة فقط اختيار النوع!', true);
    }
    
    game.gameType = type === 'select_objects' ? 'objects' : 'places';
    game.status = 'setting_up';
    
    userStates.set(userId, { 
        step: 'waiting_normal_players', 
        chatId: chatId 
    });
    
    await bot.editMessageText(`📝 **إعداد اللعبة**\n\n🎯 النوع المختار: ${game.gameType === 'objects' ? 'أشياء 📦' : 'أماكن 📍'}\n\n❓ **كم عدد الأشخاص العاديين؟**\n📊 (من 3 إلى 30 لاعب)`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown'
    });
    
    bot.answerCallbackQuery(query.id, '✅ تم اختيار نوع اللعبة');
}

// =======================
// معالجة الرسائل النصية
// =======================

bot.on('message', async (msg) => {
    if (msg.text && msg.text.startsWith('/')) return; // تجاهل الأوامر
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (!text) return;
    
    // التحقق من الإقصاء
    if (isUserBanned(userId)) return;
    
    const userState = userStates.get(userId);
    if (!userState) return;
    
    await sendTypingAction(chatId);
    
    switch (userState.step) {
        case 'waiting_normal_players':
            await handleNormalPlayersInput(msg, userState);
            break;
            
        case 'waiting_spies_count':
            await handleSpiesCountInput(msg, userState);
            break;
            
        case 'waiting_game_duration':
            await handleGameDurationInput(msg, userState);
            break;
            
        default:
            // معالجة أوامر المتجر والبنك
            if (msg.chat.type === 'private') {
                await handlePrivateCommands(msg);
            }
            break;
    }
});

async function handleNormalPlayersInput(msg, userState) {
    const count = parseInt(msg.text);
    const game = activeGames.get(userState.chatId);
    
    if (!game) {
        userStates.delete(msg.from.id);
        return;
    }
    
    if (count < 3 || count > 30) {
        return bot.sendMessage(msg.chat.id, '❌ **عدد غير صحيح!**\n\n📊 يجب أن يكون العدد بين 3 و 30 لاعب', {
            parse_mode: 'Markdown'
        });
    }
    
    game.normalPlayersCount = count;
    userState.step = 'waiting_spies_count';
    
    const maxSpies = Math.floor(count / 3);
    
    await bot.sendMessage(msg.chat.id, `✅ **تم تحديد عدد اللاعبين العاديين: ${count}**\n\n❓ **كم عدد الجواسيس؟**\n🕵️ (من 1 إلى ${maxSpies} جاسوس)`, {
        parse_mode: 'Markdown'
    });
    
    safeDeleteMessage(msg.chat.id, msg.message_id);
}

async function handleSpiesCountInput(msg, userState) {
    const count = parseInt(msg.text);
    const game = activeGames.get(userState.chatId);
    
    if (!game) {
        userStates.delete(msg.from.id);
        return;
    }
    
    const maxSpies = Math.floor(game.normalPlayersCount / 3);
    
    if (count < 1 || count > maxSpies) {
        return bot.sendMessage(msg.chat.id, `❌ **عدد غير صحيح!**\n\n🕵️ يجب أن يكون عدد الجواسيس بين 1 و ${maxSpies}`, {
            parse_mode: 'Markdown'
        });
    }
    
    game.spiesCount = count;
    userState.step = 'waiting_game_duration';
    
    await bot.sendMessage(msg.chat.id, `✅ **تم تحديد عدد الجواسيس: ${count}**\n\n❓ **كم دقيقة تريدون هذه البارتية؟**\n⏰ (من 1 إلى 15 دقيقة)`, {
        parse_mode: 'Markdown'
    });
    
    safeDeleteMessage(msg.chat.id, msg.message_id);
}

async function handleGameDurationInput(msg, userState) {
    const duration = parseInt(msg.text);
    const game = activeGames.get(userState.chatId);
    
    if (!game) {
        userStates.delete(msg.from.id);
        return;
    }
    
    if (duration < 1 || duration > 15) {
        return bot.sendMessage(msg.chat.id, '❌ **مدة غير صحيحة!**\n\n⏰ يجب أن تكون المدة بين 1 و 15 دقيقة', {
            parse_mode: 'Markdown'
        });
    }
    
    game.gameDuration = duration;
    userStates.delete(msg.from.id);
    
    await bot.sendMessage(msg.chat.id, `✅ **تم إعداد اللعبة بنجاح!**\n\n📋 **ملخص اللعبة:**\n🎯 النوع: ${game.gameType === 'objects' ? 'أشياء 📦' : 'أماكن 📍'}\n👥 اللاعبين العاديين: ${game.normalPlayersCount}\n🕵️ الجواسيس: ${game.spiesCount}\n⏰ المدة: ${duration} دقيقة\n\n📨 **ارسل لي كلمة "start" في الخاص لترى دورك**`, {
        parse_mode: 'Markdown'
    });
    
    // توزيع الأدوار
    gameLogic.distributeRoles(game);
    game.status = 'waiting_start_requests';
    
    safeDeleteMessage(msg.chat.id, msg.message_id);
}

// =======================
// أمر اللعبة الجديدة /newgame
// =======================

bot.onText(/\/newgame/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'المستخدم';
    
    // التحقق من نوع الدردشة
    if (msg.chat.type === 'private') {
        return bot.sendMessage(chatId, '❌ هذا الأمر يعمل فقط في المجموعات!');
    }
    
    logUserAction(userId, 'COMMAND_NEWGAME');
    await sendTypingAction(chatId);
    
    // التحقق من الإقصاء
    if (isUserBanned(userId)) {
        return bot.sendMessage(chatId, `${firstName}، أنت مقصي من اللعبة 🚫\nاتصل بالمطور للإفراج عنك\nالمطور: @V_b_L_o`);
    }
    
    // التحقق من صلاحيات البوت
    const isBotAdm = await isBotAdmin(chatId);
    if (!isBotAdm) {
        return bot.sendMessage(chatId, '❌ **لا استطيع إكمال اللعبة إلا عند رفعي أدمن!**', {
            parse_mode: 'Markdown'
        });
    }
    
    // التحقق من وجود لعبة جارية
    if (activeGames.has(chatId)) {
        const game = activeGames.get(chatId);
        return bot.sendMessage(chatId, `❌ **لا يمكن بداية لعبة جديدة حتى تكمل البارتية!**\n\n🎮 الحالة الحالية: ${getGameStatusText(game.status)}`, {
            parse_mode: 'Markdown'
        });
    }
    
    const newGameKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔵 أبدا اللعبة', callback_data: 'start_new_game' }
                ],
                [
                    { text: '🟠 كيفاه تتعلب هذي اللعبة', callback_data: 'game_instructions' }
                ],
                [
                    { text: '🟣 انضم للقناة للمزيد من المتعة', url: 'https://t.me/+0ipdbPwuF304OWRk' }
                ]
            ]
        }
    };
    
    await bot.sendMessage(chatId, `🤔 **${firstName}، حاب تبدا تلعب؟**\n\n🎯 اختر من الأزرار أدناه لبدء المغامرة!`, {
        parse_mode: 'Markdown',
        ...newGameKeyboard
    });
});

// =======================
// معالجة إضافة البوت للمجموعة
// =======================

bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    
    for (const member of newMembers) {
        if (member.id === (await bot.getMe()).id) {
            const isBotAdm = await isBotAdmin(chatId);
            
            if (!isBotAdm) {
                await bot.sendMessage(chatId, '⚠️ **تنبيه مهم!**\n\nلا استطيع إكمال اللعبة إلا عند رفعي أدمن\n\n🔧 **يرجى منحي صلاحيات الإدارة للعمل بشكل صحيح**', {
                    parse_mode: 'Markdown'
                });
            } else {
                const welcomeKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🎮 ابدأ لعبة جديدة', callback_data: 'start_new_game' }
                            ],
                            [
                                { text: '📖 تعلم كيفية اللعب', callback_data: 'game_instructions' }
                            ]
                        ]
                    }
                };
                
                await bot.sendMessage(chatId, `👋 **شكراً لإضافتي!**\n\n🎉 **مرحباً بكم في عالم Spyfall المثير!**\n\n🎯 اضغط على /newgame للبدء\n🔗 انضموا لقناتنا: https://t.me/+0ipdbPwuF304OWRk`, {
                    parse_mode: 'Markdown',
                    ...welcomeKeyboard
                });
            }
        }
    }
});

// =======================
// معالجة الأوامر الخاصة
// =======================

bot.onText(/^start$/i, async (msg) => {
    if (msg.chat.type !== 'private') return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await sendTypingAction(chatId);
    
    // البحث عن اللعبة التي ينتمي إليها المستخدم
    let userGame = null;
    let gameChatId = null;
    
    for (const [gChatId, game] of activeGames.entries()) {
        if (game.status === 'waiting_start_requests' && 
            game.players.some(p => p.id === userId)) {
            userGame = game;
            gameChatId = gChatId;
            break;
        }
    }
    
    if (!userGame) {
        return bot.sendMessage(chatId, '❌ لا توجد لعبة متاحة لك\n\n🎯 ابحث عن مجموعة تلعب Spyfall وانضم إليها!');
    }
    
    const player = userGame.players.find(p => p.id === userId);
    if (!player) return;
    
    if (player.role === 'spy') {
        // رسالة للجاسوس
        try {
            await bot.sendPhoto(chatId, 'https://pin.it/2Xv5gZUHU', {
                caption: `🕵️‍♂️ **أنت هو الجاسوس!**\n\n🎭 مهمتك:\n🔍 اكتشف المكان أو الشيء السري\n🤫 لا تفضح نفسك\n💬 اسأل أسئلة ذكية\n⚡ تذكر: يمكنك إعلان تخمينك في أي وقت\n\n🔥 **اعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!**`, {
                    parse_mode: 'Markdown'
                }
            });
        } catch (error) {
            await bot.sendMessage(chatId, `🕵️‍♂️ **أنت هو الجاسوس!**\n\n🎭 مهمتك:\n🔍 اكتشف المكان أو الشيء السري\n🤫 لا تفضح نفسك\n💬 اسأل أسئلة ذكية\n⚡ تذكر: يمكنك إعلان تخمينك في أي وقت\n\n🔥 **اعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!**`, {
                parse_mode: 'Markdown'
            });
        }
    } else {
        // رسالة للاعب عادي
        const itemType = userGame.gameType === 'objects' ? 'الشيء' : 'الموقع';
        const itemIcon = userGame.gameType === 'objects' ? '📦' : '📍';
        
        await bot.sendMessage(chatId, `👤 **أنت ماكش جاسوس** 🚫🕵️\n\n${itemIcon} **${itemType}:** ${userGame.selectedItem}\n\n🎯 **مهمتك:**\n🔍 اكتشف من هو الجاسوس\n💬 اسأل أسئلة ذكية دون فضح ${itemType}\n🗳️ صوت على الجاسوس المشكوك فيه\n\n💡 **تذكر:** الجاسوس لا يعرف ${itemType}!`, {
            parse_mode: 'Markdown'
        });
    }
    
    userGame.startRequests.add(userId);
    logUserAction(userId, 'RECEIVED_ROLE', player.role);
    
    // التحقق من استلام جميع اللاعبين لأدوارهم
    if (userGame.startRequests.size === userGame.players.length) {
        startGameplay(gameChatId);
    }
});

// =======================
// دوال مساعدة للعبة
// =======================

async function updateGameMessage(chatId, messageId, game) {
    const playersText = game.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const remainingTime = Math.max(0, 90 - Math.floor((Date.now() - game.createdAt) / 1000));
    
    const gameKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🟢 انضم للعبة', callback_data: 'join_game' }
                ],
                [
                    { text: '🟠 كيفاه تتعلب هذي اللعبة', callback_data: 'game_instructions' }
                ],
                [
                    { text: '🟣 انضم للقناة للمزيد من المتعة', url: 'https://t.me/+0ipdbPwuF304OWRk' }
                ]
            ]
        }
    };
    
    try {
        await bot.editMessageText(
            `🎮 **لعبة جديدة جاهزة!**\n\n👥 **اللاعبين (${game.players.length}):**\n${playersText || 'لا يوجد لاعبين بعد'}\n\n⏳ **الوقت المتبقي:** ${remainingTime} ثانية`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                ...gameKeyboard
            }
        );
    } catch (error) {
        console.error('Error updating game message:', error);
    }
}

async function proceedToGameSetup(chatId) {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    if (game.players.length < 3) {
        await bot.sendMessage(chatId, '❌ **عذراً، نحتاج 3 لاعبين على الأقل لبدء اللعبة!**\n\n🎯 ادعوا أصدقاءكم وحاولوا مرة أخرى', {
            parse_mode: 'Markdown'
        });
        activeGames.delete(chatId);
        return;
    }
    
    game.status = 'choosing_type';
    
    const typeKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📦 اشياء', callback_data: 'select_objects' },
                    { text: '📍 اماكن', callback_data: 'select_places' }
                ]
            ]
        }
    };
    
    await bot.sendMessage(chatId, `🎯 **واش حابين؟**\n\n📊 **عدد اللاعبين:** ${game.players.length}\n\n🎮 اختاروا نوع اللعبة:`, {
        parse_mode: 'Markdown',
        ...typeKeyboard
    });
}

async function startGameplay(chatId) {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    game.status = 'playing';
    game.gameStartTime = Date.now();
    
    await bot.sendMessage(chatId, `📢 **صَيَّبو مدينا الأدوار، ابداو تلعبو!** 🎲🕰️\n\n🎯 **نوع اللعبة:** ${game.gameType === 'objects' ? 'أشياء 📦' : 'أماكن 📍'}\n⏰ **مدة اللعبة:** ${game.gameDuration} دقيقة\n👥 **عدد اللاعبين:** ${game.players.length}\n🕵️ **عدد الجواسيس:** ${game.spiesCount}\n\n🔥 **دعوا المغامرة تبدأ!**`, {
        parse_mode: 'Markdown'
    });
    
    // تايمر انتهاء اللعبة
    const gameEndTime = (game.gameDuration * 60 - 40) * 1000;
    
    setTimeout(() => {
        startVotingPhase(chatId);
    }, gameEndTime);
}

async function startVotingPhase(chatId) {
    const game = activeGames.get(chatId);
    if (!game || game.status !== 'playing') return;
    
    game.status = 'voting';
    game.votes = new Map();
    
    await bot.sendMessage(chatId, `⏰ **وقت التصويت!**\n\n📨 **أرسلت لكم التصويت في الخاص**\n\n🗳️ صوتوا على من تشكون أنه الجاسوس!`, {
        parse_mode: 'Markdown'
    });
    
    // إرسال أزرار التصويت لكل لاعب
    for (const player of game.players) {
        await sendVotingButtons(player.id, game, chatId);
    }
    
    // تايمر انتهاء التصويت
    setTimeout(() => {
        endVotingPhase(chatId);
    }, 60000);
}

async function sendVotingButtons(userId, game, gameChatId) {
    const buttons = game.players
        .filter(p => p.id !== userId)
        .map(p => [{
            text: p.name,
            callback_data: `vote_${gameChatId}_${p.id}_${userId}`
        }]);
    
    if (buttons.length === 0) return;
    
    try {
        await bot.sendMessage(userId, `🗳️ **على من تصوت أنه الجاسوس؟**\n\n⚠️ **تذكر:** لا يمكن التصويت مرتين!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    } catch (error) {
        console.error(`Error sending voting buttons to user ${userId}:`, error);
    }
}

async function handleVoting(query) {
    const [, gameChatId, targetId, voterId] = query.data.split('_').map(Number);
    const chatId = parseInt(gameChatId);
    
    const game = activeGames.get(chatId);
    if (!game || game.status !== 'voting') {
        return bot.answerCallbackQuery(query.id, '❌ التصويت غير متاح حالياً!', true);
    }
    
    // التحقق من عدم التصويت مسبقاً
    if (game.votes.has(voterId)) {
        return bot.answerCallbackQuery(query.id, '⚠️ لقد صوتت بالفعل!', true);
    }
    
    game.votes.set(voterId, targetId);
    
    const targetPlayer = game.players.find(p => p.id === targetId);
    const voterPlayer = game.players.find(p => p.id === voterId);
    
    if (!targetPlayer || !voterPlayer) return;
    
    // إعلان في المجموعة
    await bot.sendMessage(chatId, `🗳️ **${voterPlayer.name}** صوت لإعدام **${targetPlayer.name}** ⚡`, {
        parse_mode: 'Markdown'
    });
    
    bot.answerCallbackQuery(query.id, `✅ تم تصويتك لـ ${targetPlayer.name}`);
    logUserAction(voterId, 'VOTED', `Target: ${targetId}`);
}

async function endVotingPhase(chatId) {
    const game = activeGames.get(chatId);
    if (!game) return;
    
    // حساب النتائج
    const results = gameLogic.calculateVotingResults(game);
    
    await bot.sendMessage(chatId, `📊 **نتائج التصويت:**\n\n${results.summary}`, {
        parse_mode: 'Markdown'
    });
    
    // تحديد الفائز
    if (results.winner === 'spies') {
        await handleSpyVictory(chatId, game);
    } else {
        await handlePlayersVictory(chatId, game);
    }
    
    // إنهاء اللعبة
    activeGames.delete(chatId);
}

async function handleSpyVictory(chatId, game) {
    await bot.sendMessage(chatId, '🎉 **فاز الجاسوس!** 🕵️‍♂️', {
        parse_mode: 'Markdown'
    });
    
    try {
        await bot.sendVideo(chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/spy_win.mp4', {
            caption: `🏆 **تهانينا للجاسوس!**\n\n💰 **جائزة الجاسوس:** 2,000,000,000 د.ج\n\n⚖️ **عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، ارسلوا أسماءهم لـ @V_b_L_o ليخرجهم من اللعبة نهائياً.**`,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        await bot.sendMessage(chatId, `🏆 **تهانينا للجاسوس!**\n\n💰 **جائزة الجاسوس:** 2,000,000,000 د.ج\n\n⚖️ **عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، ارسلوا أسماءهم لـ @V_b_L_o ليخرجهم من اللعبة نهائياً.**`, {
            parse_mode: 'Markdown'
        });
    }
    
    // إضافة الجوائز
    for (const player of game.players) {
        if (player.role === 'spy') {
            banking.addMoney(player.id, 2000000000);
            database.updateUserStats(player.id, 'spy_wins', 1);
        } else {
            database.updateUserStats(player.id, 'spy_losses', 1);
        }
    }
    
    await showGameResults(chatId, game, 'spies');
}

async function handlePlayersVictory(chatId, game) {
    await bot.sendMessage(chatId, '🎊 **فاز اللاعبون!** 👥', {
        parse_mode: 'Markdown'
    });
    
    try {
        await bot.sendVideo(chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/players_win.mp4', {
            caption: `🏆 **تهانينا للاعبين!**\n\n💸 **جائزة كل لاعب:** 100,000 د.ج\n\n⚖️ **عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، ارسلوا اسمه لـ @V_b_L_o ليُقصى نهائياً.**`,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        await bot.sendMessage(chatId, `🏆 **تهانينا للاعبين!**\n\n💸 **جائزة كل لاعب:** 100,000 د.ج\n\n⚖️ **عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، ارسلوا اسمه لـ @V_b_L_o ليُقصى نهائياً.**`, {
            parse_mode: 'Markdown'
        });
    }
    
    // إضافة الجوائز
    for (const player of game.players) {
        if (player.role !== 'spy') {
            banking.addMoney(player.id, 100000);
            database.updateUserStats(player.id, 'player_wins', 1);
        } else {
            database.updateUserStats(player.id, 'player_losses', 1);
        }
    }
    
    await showGameResults(chatId, game, 'players');
}

async function showGameResults(chatId, game, winner) {
    const itemType = game.gameType === 'objects' ? 'الشيء' : 'الموقع';
    const itemIcon = game.gameType === 'objects' ? '📦' : '📍';
    
    let resultsText = `📋 **نتائج اللعبة:**\n\n${itemIcon} **${itemType}:** ${game.selectedItem}\n\n👥 **اللاعبين:**\n`;
    
    for (const player of game.players) {
        const roleIcon = player.role === 'spy' ? '🕵️' : '👤';
        const roleText = player.role === 'spy' ? 'جاسوس' : 'عادي';
        const statusIcon = (winner === 'spies' && player.role === 'spy') || 
                          (winner === 'players' && player.role !== 'spy') ? '✅' : '❌';
        const statusText = statusIcon === '✅' ? 'ربح' : 'خسر';
        
        resultsText += `${roleIcon} **${player.name}** - ${roleText} - ${statusText} ${statusIcon}\n`;
    }
    
    await bot.sendMessage(chatId, resultsText, {
        parse_mode: 'Markdown'
    });
}

// =======================
// معالجة الأوامر الخاصة والمتجر
// =======================

async function handlePrivateCommands(msg) {
    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // أوامر البنك
    if (text === 'حلي بونكا') {
        await banking.handleCreateAccount(msg, bot);
    } else if (text.startsWith('فارسي ')) {
        await banking.handleTransfer(msg, bot);
    }
    
    // أوامر المتجر
    else if (text.startsWith('شراء ')) {
        await shop.handlePurchase(msg, bot);
    } else if (text.startsWith('بيع ')) {
        await shop.handleSell(msg, bot);
    } else if (text === 'ممتلكاتي') {
        await shop.handleInventory(msg, bot);
    }
    
    // معلومات الحساب
    else if (text === 'حسابي' || text === 'رصيدي') {
        await banking.handleAccountInfo(msg, bot);
    }
}

// =======================
// أوامر المطور
// =======================

bot.onText(/\/ban (.+)/, async (msg, match) => {
    const userId = msg.from.id;
    const targetUsername = match[1];
    
    if (!config.DEVELOPER_IDS.includes(userId)) {
        return bot.sendMessage(msg.chat.id, '❌ هذا الأمر للمطور فقط!');
    }
    
    // هنا يجب تحويل اسم المستخدم إلى ID
    // في هذا المثال، نفترض أن المدخل هو ID مباشرة
    const targetId = parseInt(targetUsername);
    
    if (isNaN(targetId)) {
        return bot.sendMessage(msg.chat.id, '❌ معرف مستخدم غير صحيح!');
    }
    
    bannedUsers.add(targetId);
    database.banUser(targetId);
    
    await bot.sendMessage(msg.chat.id, `✅ تم إقصاء المستخدم ${targetId} من اللعبة`);
    logUserAction(userId, 'BANNED_USER', targetId.toString());
});

bot.onText(/\/unban (.+)/, async (msg, match) => {
    const userId = msg.from.id;
    const targetUsername = match[1];
    
    if (!config.DEVELOPER_IDS.includes(userId)) {
        return bot.sendMessage(msg.chat.id, '❌ هذا الأمر للمطور فقط!');
    }
    
    const targetId = parseInt(targetUsername);
    
    if (isNaN(targetId)) {
        return bot.sendMessage(msg.chat.id, '❌ معرف مستخدم غير صحيح!');
    }
    
    bannedUsers.delete(targetId);
    database.unbanUser(targetId);
    
    await bot.sendMessage(msg.chat.id, `✅ تم إلغاء إقصاء المستخدم ${targetId}`);
    logUserAction(userId, 'UNBANNED_USER', targetId.toString());
});

// =======================
// معالجة عرض الأوامر
// =======================

bot.onText(/\//, (msg) => {
    if (msg.chat.type === 'private' || msg.text.length > 1) return;
    
    const commands = `📋 **الأوامر المتاحة:**

🎮 **/newgame** - بدء لعبة جديدة
ℹ️ **/start** - معلومات عن البوت
🏪 **المتجر** - شراء وبيع السلع
🏦 **البنك** - إدارة الحساب المالي

💡 **نصائح:**
• استخدم الأزرار للتفاعل السريع
• اتبع التعليمات خطوة بخطوة
• استمتع باللعبة! 🎉`;
    
    bot.sendMessage(msg.chat.id, commands, {
        parse_mode: 'Markdown'
    });
});

// =======================
// دوال مساعدة إضافية
// =======================

function getGameStatusText(status) {
    const statusTexts = {
        'waiting_players': 'انتظار اللاعبين',
        'choosing_type': 'اختيار نوع اللعبة',
        'setting_up': 'إعداد اللعبة',
        'waiting_start_requests': 'انتظار استلام الأدوار',
        'playing': 'جارية',
        'voting': 'مرحلة التصويت'
    };
    
    return statusTexts[status] || 'غير محدد';
}

// =======================
// تحميل البيانات المحفوظة
// =======================

async function loadSavedData() {
    try {
        const savedBannedUsers = await database.getBannedUsers();
        bannedUsers = new Set(savedBannedUsers);
        console.log('✅ تم تحميل البيانات المحفوظة بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
    }
}

// =======================
// حفظ البيانات دورياً
// =======================

setInterval(async () => {
    try {
        await database.saveData({
            bannedUsers: Array.from(bannedUsers),
            activeGamesCount: activeGames.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}, 60000); // حفظ كل دقيقة

// =======================
// معالجة الأخطاء العامة
// =======================

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// =======================
// بدء تشغيل البوت
// =======================

async function startBot() {
    try {
        await loadSavedData();
        console.log('🎮 بوت Spyfall يعمل بنجاح!');
        console.log('👨‍💻 المطور: @V_b_L_o');
        console.log('🔗 الرابط: https://t.me/spy_spy_bbot');
    } catch (error) {
        console.error('❌ خطأ في تشغيل البوت:', error);
    }
}

// تشغيل البوت
startBot();

// تصدير المتغيرات المهمة للملفات الأخرى
module.exports = {
    bot,
    activeGames,
    bannedUsers,
    userStates,
    logUserAction,
    sendTypingAction
};
