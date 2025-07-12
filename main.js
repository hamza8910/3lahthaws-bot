const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// إعدادات البوت
const token = process.env.BOT_TOKEN || 'التوكن_الافتراضي';
const developerId = 6680350152;
const developerUsername = '@V_b_L_o';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// تحميل البيانات
let data = {};
try {
    data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
} catch (error) {
    data = {
        users: {},
        games: {},
        banned: [],
        shops: {},
        banks: {},
        stats: {}
    };
}

// حفظ البيانات
function saveData() {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

// قوائم الأماكن والأشياء
const places = [
    'المطعم', 'المدرسة', 'المستشفى', 'البنك', 'الحديقة', 'الشاطئ', 'المطار', 'المتجر', 'المكتبة', 'الجامعة',
    'الملعب', 'السينما', 'الفندق', 'المسجد', 'الكنيسة', 'المتحف', 'الحديقة الحيوانية', 'المسرح', 'الملاهي', 'القطار',
    'الباص', 'السيارة', 'الطائرة', 'السفينة', 'البيت', 'الشقة', 'الفيلا', 'المزرعة', 'الغابة', 'الجبل'
];

const items = [
    'التفاح', 'الموز', 'البرتقال', 'العنب', 'الفراولة', 'الأناناس', 'المانجو', 'الكيوي', 'الخوخ', 'الإجاص',
    'الليمون', 'الجوافة', 'الرمان', 'التين', 'التمر', 'الجزر', 'الطماطم', 'الخيار', 'الباذنجان', 'الفلفل',
    'البصل', 'الثوم', 'البطاطس', 'الكوسا', 'الملفوف', 'الخس', 'السبانخ', 'البقدونس', 'النعناع', 'الزعتر'
];

// قائمة المتجر
const shopItems = {
    'تبون': 100000000,
    'شنڤريحة': 200000000,
    'شاب بيلو': 300000000,
    'ديدين كلاش': 400000000,
    'ايناس عبدلي': 500000000,
    'ريفكا': 600000000,
    'كريم': 700000000,
    'عادل ميكسيك': 800000000,
    'مراد طهاري': 900000000
};

// فحص إذا كان المستخدم محظور
function isBanned(userId) {
    return data.banned.includes(userId);
}

// فحص إذا كان المستخدم مشرف
async function isAdmin(chatId, userId) {
    try {
        const chatMember = await bot.getChatMember(chatId, userId);
        return ['creator', 'administrator'].includes(chatMember.status);
    } catch (error) {
        return false;
    }
}

// فحص إذا كان البوت مشرف
async function isBotAdmin(chatId) {
    try {
        const botInfo = await bot.getMe();
        const chatMember = await bot.getChatMember(chatId, botInfo.id);
        return ['creator', 'administrator'].includes(chatMember.status);
    } catch (error) {
        return false;
    }
}

// رسالة البداية
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    if (msg.chat.type === 'private') {
        const welcomeText = `🕵️‍♂️ لعبة Spyfall هي لعبة اجتماعية قصيرة (3–30 لاعبين)
يجتهد فيها "الجاسوس" في تخمين مكان سري،
بينما يحاول الآخرون كشفه بأسئلة ذكية،
أو ينتصر الجاسوس إذا ظل خفيًا أو خمن المكان.
🔗 رابط المجموعة: https://t.me/+0ipdbPwuF304OWRk
👨‍💻 المطور: @V_b_L_o`;

        const keyboard = {
            inline_keyboard: [
                [{ text: '🔘 اضغط هنا باه تفهم', callback_data: 'rules' }],
                [{ text: '🔘 اضفني لمجموعتك لبدأ اللعبة', url: 'http://t.me/spy_spy_bbot?startgroup=new' }]
            ]
        };

        try {
            await bot.sendPhoto(chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/Welcome.jpg', {
                caption: welcomeText,
                reply_markup: keyboard
            });
        } catch (error) {
            await bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard });
        }
    }
});

// تحديث قائمة الأوامر
bot.setMyCommands([
    { command: 'start', description: 'بدء البوت' },
    { command: 'newgame', description: 'بدء لعبة جديدة' },
    { command: 'endgame', description: 'إنهاء اللعبة الحالية (للمشرفين)' },
    { command: 'help', description: 'المساعدة' },
    { command: 'profile', description: 'إحصائياتي' },
    { command: 'shop', description: 'المتجر' },
    { command: 'bank', description: 'البنك' },
    { command: 'stats', description: 'إحصائيات المجموعة' }
]);

// معالجة الأزرار
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data_callback = callbackQuery.data;

    if (isBanned(userId)) {
        return bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o',
            show_alert: true 
        });
    }

    try {
        // معالجة قواعد اللعبة
        if (data_callback === 'rules') {
            const rulesText = `📜 قواعد اللعبة:
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

            await bot.sendMessage(userId, rulesText);
        }

        // معالجة بدء اللعبة
        else if (data_callback === 'start_game') {
            if (msg.chat.type === 'private') return;
            
            const gameId = chatId + '_' + Date.now();
            data.games[gameId] = {
                chatId: chatId,
                status: 'joining',
                players: [],
                gameType: null,
                normalPlayers: 0,
                spies: 0,
                duration: 0,
                currentItem: null,
                votes: {},
                startTime: null,
                joinStartTime: Date.now()
            };
            
            const joinKeyboard = {
                inline_keyboard: [
                    [{ text: '🟢 انضم للعبة', callback_data: `join_${gameId}` }],
                    [{ text: '🟠 كيفاه تتعلب هذي اللعبة', callback_data: 'rules' }],
                    [{ text: '🟣 انضم للقناة للمزيد من المتعة', url: 'https://t.me/+0ipdbPwuF304OWRk' }]
                ]
            };

            await bot.editMessageText('🤔 حاب تبدا تلعب؟', {
                chat_id: chatId,
                message_id: msg.message_id,
                reply_markup: joinKeyboard
            });

            // مؤقت الانضمام (90 ثانية)
            setTimeout(async () => {
                if (data.games[gameId] && data.games[gameId].status === 'joining') {
                    if (data.games[gameId].players.length < 3) {
                        await bot.sendMessage(chatId, 'لم ينضم عدد كافي من اللاعبين. تم إلغاء اللعبة.');
                        delete data.games[gameId];
                        saveData();
                        return;
                    }

                    const typeKeyboard = {
                        inline_keyboard: [
                            [{ text: '📦 اشياء', callback_data: `type_items_${gameId}` }],
                            [{ text: '📍 اماكن', callback_data: `type_places_${gameId}` }]
                        ]
                    };

                    await bot.sendMessage(chatId, 'واش حابين؟', { reply_markup: typeKeyboard });
                }
            }, 90000);
            
            saveData();
        }

        // معالجة الانضمام للعبة
        else if (data_callback.startsWith('join_')) {
            const gameId_join = data_callback.substring(5);
            const game = data.games[gameId_join];
            
            if (!game) {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'اللعبة غير موجودة',
                    show_alert: true 
                });
            }

            if (game.status !== 'joining') {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'اللعبة شغالة انتظر تخلص',
                    show_alert: true 
                });
            }

            if (game.players.find(p => p.id === userId)) {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'أنت مسجل بالفعل',
                    show_alert: true 
                });
            }

            game.players.push({
                id: userId,
                name: callbackQuery.from.first_name,
                username: callbackQuery.from.username
            });

            let playersList = game.players.map((player, index) => `${index + 1}. ${player.name}`).join('\n');
            
            await bot.editMessageText(`🟢 اللاعبون المنضمون:\n${playersList}`, {
                chat_id: chatId,
                message_id: msg.message_id,
                reply_markup: msg.reply_markup
            });

            saveData();
        }

        // معالجة اختيار نوع اللعبة
        else if (data_callback.startsWith('type_')) {
            const parts = data_callback.split('_');
            const gameType = parts[1];
            const gameId_type = parts.slice(2).join('_');
            
            const game_type = data.games[gameId_type];
            
            if (!game_type) {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'اللعبة غير موجودة',
                    show_alert: true 
                });
            }
            
            game_type.gameType = gameType;
            game_type.status = 'configuring';
            
            await bot.sendMessage(chatId, '📝 كم عدد الأشخاص العاديين؟ (3-30)');
            
            data.games[gameId_type].waitingFor = 'normalPlayers';
            saveData();
        }

        // معالجة التصويت
        else if (data_callback.startsWith('vote_')) {
            const parts = data_callback.split('_');
            const targetId = parts[1];
            const gameId_vote = parts.slice(2).join('_');
            
            const game_vote = data.games[gameId_vote];
            
            if (!game_vote || game_vote.status !== 'voting') {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'اللعبة غير موجودة أو انتهت',
                    show_alert: true 
                });
            }
            
            if (game_vote.votes[userId]) {
                return bot.answerCallbackQuery(callbackQuery.id, { 
                    text: 'لا يمكن التصويت مرتين',
                    show_alert: true 
                });
            }
            
            game_vote.votes[userId] = targetId;
            
            const targetPlayer = game_vote.players.find(p => p.id.toString() === targetId);
            const voterPlayer = game_vote.players.find(p => p.id === userId);
            
            if (targetPlayer && voterPlayer) {
                await bot.sendMessage(game_vote.chatId, `${voterPlayer.name} صوت لإعدام ${targetPlayer.name} 🗳️`);
            }
            
            const totalVotes = Object.keys(game_vote.votes).length;
            if (totalVotes === game_vote.players.length) {
                await endGame(gameId_vote);
            }
            
            saveData();
        }

        // معالجة خيارات البنك
        else if (data_callback.startsWith('bank_')) {
            const bankName = data_callback.substring(5);
            const accountNumber = Math.floor(Math.random() * 10000) + '-' + Math.floor(Math.random() * 10000);
            
            if (!data.banks[userId]) {
                data.banks[userId] = {
                    bank: bankName,
                    account: accountNumber,
                    balance: 0
                };
            }
            
            await bot.sendMessage(chatId, `🏦 تم فتح الحساب في بنك ${bankName}\n💰 رصيدك: 0 د.ج\n🔢 رقم الحساب: ${accountNumber}`);
            saveData();
        }

        // إنهاء معالجة الزر بنجاح
        bot.answerCallbackQuery(callbackQuery.id, { text: '' });

    } catch (error) {
        console.error('خطأ في معالجة الزر:', error);
        bot.answerCallbackQuery(callbackQuery.id, { 
            text: 'حدث خطأ، حاول مرة أخرى',
            show_alert: true 
        });
    }
});

// معالجة الرسائل النصية
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    // معالجة إعدادات اللعبة
    const activeGame = Object.values(data.games).find(game => 
        game.chatId === chatId && game.status === 'configuring'
    );

    if (activeGame && activeGame.waitingFor && /^\d+$/.test(text)) {
        const num = parseInt(text);
        
        switch (activeGame.waitingFor) {
            case 'normalPlayers':
                if (num >= 3 && num <= 30) {
                    activeGame.normalPlayers = num;
                    activeGame.waitingFor = 'spies';
                    await bot.sendMessage(chatId, '📝 كم عدد الجواسيس؟ (1-10)');
                } else {
                    await bot.sendMessage(chatId, 'العدد يجب أن يكون بين 3 و 30');
                }
                break;
                
            case 'spies':
                if (num >= 1 && num <= 10) {
                    // التحقق من نسبة الجواسيس
                    if (num <= Math.floor(activeGame.normalPlayers / 3)) {
                        activeGame.spies = num;
                        activeGame.waitingFor = 'duration';
                        await bot.sendMessage(chatId, '📝 كم دقيقة تريدون هذه البارتية؟ (1-15)');
                    } else {
                        await bot.sendMessage(chatId, 'عدد الجواسيس كثير! لكل 3 لاعبين جاسوس واحد');
                    }
                } else {
                    await bot.sendMessage(chatId, 'العدد يجب أن يكون بين 1 و 10');
                }
                break;
                
            case 'duration':
                if (num >= 1 && num <= 15) {
                    activeGame.duration = num;
                    activeGame.waitingFor = null;
                    
                    await bot.sendMessage(chatId, 'ارسل لي كلمة start في الخاص ل ترى دورك');
                    
                    // توزيع الأدوار
                    await distributeRoles(activeGame);
                } else {
                    await bot.sendMessage(chatId, 'المدة يجب أن تكون بين 1 و 15 دقيقة');
                }
                break;
        }
        
        saveData();
        return;
    }

    // معالجة كلمة start في الخاص
    if (text === 'start' && msg.chat.type === 'private') {
        const userGames = Object.values(data.games).filter(game => 
            game.players.find(p => p.id === userId) && game.status === 'distributing'
        );
        
        if (userGames.length > 0) {
            const game = userGames[0];
            const player = game.players.find(p => p.id === userId);
            
            if (player.role === 'spy') {
                await bot.sendMessage(chatId, 'أنت هو الجاسوس 🕵️‍♂️ اعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!');
                try {
                    await bot.sendPhoto(chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/Spy_role.jpg');
                } catch (error) {
                    console.log('خطأ في إرسال صورة الجاسوس');
                }
            } else {
                await bot.sendMessage(chatId, `أنت ماكش جاسوس 🚫🕵️\nال${game.gameType === 'items' ? 'شيء' : 'مكان'}: ${game.currentItem}`);
            }
        }
        return;
    }

    // أوامر المتجر والبنك
    if (text.startsWith('شراء ')) {
        await handlePurchase(chatId, userId, text);
        return;
    }

    if (text.startsWith('بيع ')) {
        await handleSell(chatId, userId, text);
        return;
    }

    if (text.startsWith('فارسي ')) {
        await handleTransfer(chatId, userId, text);
        return;
    }

    if (text === 'ممتلكاتي') {
        await showUserItems(chatId, userId);
        return;
    }

    if (text === 'حلي بونكا') {
        await showBankOptions(chatId, userId);
        return;
    }
});

// أمر بدء لعبة جديدة
bot.onText(/\/newgame/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    if (msg.chat.type === 'private') {
        return bot.sendMessage(chatId, 'هذا الأمر يعمل فقط في المجموعات');
    }

    // فحص إذا كان البوت مشرف
    if (!(await isBotAdmin(chatId))) {
        return bot.sendMessage(chatId, 'لا يمكن بدأ اللعبة الا وانا مشرف لذا ارفعني مشرف واعد المحاولة');
    }

    // فحص إذا كان هناك لعبة جارية
    const activeGame = Object.values(data.games).find(game => 
        game.chatId === chatId && game.status !== 'finished'
    );

    if (activeGame) {
        return bot.sendMessage(chatId, 'لا يمكن بداية لعبة جديدة حتى تكمل البارتية');
    }

    const keyboard = {
        inline_keyboard: [
            [{ text: '🔵 أبدا اللعبة', callback_data: 'start_game' }],
            [{ text: '🟠 كيفاه تتعلب هذي اللعبة', callback_data: 'rules' }],
            [{ text: '🟣 انضم للقناة للمزيد من المتعة', url: 'https://t.me/+0ipdbPwuF304OWRk' }]
        ]
    };

    await bot.sendMessage(chatId, '🤔 حاب تبدا تلعب؟', { reply_markup: keyboard });
});

// معالجة انضمام البوت للمجموعة
bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    for (const member of newMembers) {
        if (member.is_bot && member.username === 'spy_spy_bbot') {
            if (!(await isBotAdmin(chatId))) {
                await bot.sendMessage(chatId, 'لا يمكن بدأ اللعبة الا وانا مشرف لذا ارفعني مشرف واعد المحاولة');
            } else {
                await bot.sendMessage(chatId, '👋 شكرًا لإضافتي! لبدا اللعبة اضغط على /newgame للبدء.');
            }
            break;
        }
    }
});

// توزيع الأدوار
async function distributeRoles(game) {
    try {
        const players = [...game.players];
        const spyCount = game.spies;
        
        // اختيار الجواسيس عشوائياً
        const shuffled = players.sort(() => 0.5 - Math.random());
        const spies = shuffled.slice(0, spyCount);
        const normalPlayers = shuffled.slice(spyCount);
        
        // تحديد الموضوع/المكان
        const itemsList = game.gameType === 'items' ? items : places;
        const randomItem = itemsList[Math.floor(Math.random() * itemsList.length)];
        game.currentItem = randomItem;
        
        // إعطاء الأدوار
        spies.forEach(spy => {
            spy.role = 'spy';
            spy.receivedRole = false;
        });
        
        normalPlayers.forEach(player => {
            player.role = 'normal';
            player.receivedRole = false;
        });
        
        game.status = 'distributing';
        game.rolesSent = false;
        
        console.log(`توزيع الأدوار: ${spyCount} جواسيس، ${normalPlayers.length} لاعبين عاديين`);
        console.log(`الموضوع: ${randomItem}`);
        
        saveData();
        
        // إرسال رسالة إرشادية للمجموعة
        await bot.sendMessage(game.chatId, 'ارسل لي كلمة start في الخاص ل ترى دورك');
        
        // انتظار ثانيتين ثم إرسال الأدوار مباشرة
        setTimeout(async () => {
            await sendRolesToPlayers(game);
            
            // بدء اللعبة بعد إرسال الأدوار بـ 10 ثوان
            setTimeout(async () => {
                if (!game.gameStarted) {
                    await startGame(game);
                }
            }, 10000);
        }, 2000);
        
    } catch (error) {
        console.error('خطأ في توزيع الأدوار:', error);
        await bot.sendMessage(game.chatId, 'حدث خطأ في توزيع الأدوار. سيتم إعادة المحاولة...');
        
        setTimeout(() => {
            distributeRoles(game);
        }, 5000);
    }
}
// إرسال الأدوار للاعبين
async function sendRolesToPlayers(game) {
    let successCount = 0;
    let failedPlayers = [];
    
    for (const player of game.players) {
        try {
            if (player.role === 'spy') {
                await bot.sendMessage(player.id, 'أنت هو الجاسوس 🕵️‍♂️ اعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!');
                
                try {
                    await bot.sendPhoto(player.id, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/Spy_role.jpg');
                } catch (photoError) {
                    console.log(`لا يمكن إرسال صورة الجاسوس للاعب ${player.name}`);
                }
            } else {
                const itemType = game.gameType === 'items' ? 'الشيء' : 'المكان';
                await bot.sendMessage(player.id, `أنت ماكش جاسوس 🚫🕵️\n${itemType}: ${game.currentItem}`);
            }
            
            player.receivedRole = true;
            successCount++;
            console.log(`تم إرسال الدور للاعب: ${player.name}`);
            
        } catch (error) {
            console.error(`لا يمكن إرسال الدور للاعب ${player.name}:`, error.message);
            failedPlayers.push(player.name);
        }
    }
    
    game.rolesSent = true;
    saveData();
    
    // إرسال تقرير في المجموعة
    if (failedPlayers.length > 0) {
        await bot.sendMessage(game.chatId, 
            `⚠️ تم إرسال الأدوار لـ ${successCount} لاعب من أصل ${game.players.length}\n` +
            `لم يتمكن من إرسال الأدوار لـ: ${failedPlayers.join(', ')}\n` +
            `تأكدوا من بدء محادثة مع البوت في الخاص أولاً.`
        );
    } else {
        await bot.sendMessage(game.chatId, `✅ تم إرسال جميع الأدوار بنجاح!`);
    }
}

// بدء اللعبة
async function startGame(game) {
    if (!game || game.status !== 'distributing' || game.gameStarted) return;
    
    game.status = 'playing';
    game.startTime = Date.now();
    game.gameStarted = true;
    
    console.log('بدء اللعبة بعد توزيع الأدوار');
    
    await bot.sendMessage(game.chatId, '📢 صَيَّبو مدينا الأدوار، ابداو تلعبو! 🎲🕰️');
    
    // مؤقت انتهاء اللعبة
    const duration = game.duration * 60 * 1000;
    
    setTimeout(async () => {
        if (game.status === 'playing') {
            await startVoting(game);
        }
    }, duration - 40000);
    
    saveData();
}

// بدء التصويت
async function startVoting(game) {
    if (!game || game.status !== 'playing') return;
    
    game.status = 'voting';
    game.votes = {};
    
    await bot.sendMessage(game.chatId, '⏰ أرسلت لكم التصويت في الخاص لتصوتو على كل واحد على من هو الجاسوس ركزو جيدا فالعقاب شديد');
    
    // إرسال أزرار التصويت لكل لاعب
    for (const player of game.players) {
        const otherPlayers = game.players.filter(p => p.id !== player.id);
        const voteKeyboard = {
            inline_keyboard: otherPlayers.map(p => [{
                text: p.name,
                callback_data: `vote_${p.id}_${Object.keys(data.games).find(key => data.games[key] === game)}`
            }])
        };
        
        try {
            await bot.sendMessage(player.id, 'على من تصوت أنه الجاسوس؟', { reply_markup: voteKeyboard });
        } catch (error) {
            console.log(`لا يمكن إرسال رسالة للاعب ${player.name}`);
        }
    }
    
    // انتهاء التصويت بعد 60 ثانية
    setTimeout(async () => {
        if (game.status === 'voting') {
            await endGame(Object.keys(data.games).find(key => data.games[key] === game));
        }
    }, 60000);
    
    saveData();
}

// انتهاء اللعبة
async function endGame(gameId) {
    const game = data.games[gameId];
    if (!game) return;
    
    game.status = 'finished';
    
    // حساب النتائج
    const voteCounts = {};
    Object.values(game.votes).forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });
    
    // العثور على اللاعب الأكثر حصولاً على الأصوات
    const mostVoted = Object.keys(voteCounts).reduce((a, b) => 
        voteCounts[a] > voteCounts[b] ? a : b
    );
    
    const mostVotedPlayer = game.players.find(p => p.id.toString() === mostVoted);
    const spies = game.players.filter(p => p.role === 'spy');
    
    let spiesWon = false;
    let winMessage = '';
    
    if (mostVotedPlayer && mostVotedPlayer.role === 'spy') {
        // فوز اللاعبين العاديين
        winMessage = '🎊 فاز اللاعبون!';
        
        // إضافة الأموال للاعبين العاديين
        game.players.forEach(player => {
            if (player.role === 'normal') {
                if (!data.users[player.id]) data.users[player.id] = { money: 0, items: {} };
                data.users[player.id].money += 100000;
            }
        });
        
        winMessage += '\n💸 مكافأة لكل لاعب: 100,000 د.ج';
        winMessage += '\n"عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، ارسلوا اسمه لـ @V_b_L_o ليُقصى نهائيًا."';
        
        // إرسال فيديو فوز اللاعبين
        try {
            await bot.sendVideo(game.chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/players_win.mp4', { caption: winMessage });
        } catch (error) {
            await bot.sendMessage(game.chatId, winMessage);
        }
    } else {
        // فوز الجواسيس
        spiesWon = true;
        winMessage = '🎉 فاز الجاسوس!';
        
        // إضافة الأموال للجواسيس
        spies.forEach(spy => {
            if (!data.users[spy.id]) data.users[spy.id] = { money: 0, items: {} };
            data.users[spy.id].money += 2000000000;
        });
        
        winMessage += '\n💰 جائزة مالية: 2,000,000,000 د.ج';
        winMessage += '\n"عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، ارسلوا أسمائهم لـ @V_b_L_o ليخرجهم من اللعبة نهائيًا."';
        
        // إرسال فيديو فوز الجاسوس
        try {
            await bot.sendVideo(game.chatId, 'https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/spy_win.mp4', { caption: winMessage });
        } catch (error) {
            await bot.sendMessage(game.chatId, winMessage);
        }
    }
    
    // عرض النتائج
    let resultsMessage = `\n\n${game.gameType === 'items' ? '📦 الشيء' : '📍 المكان'}: ${game.currentItem}\n\n`;
    resultsMessage += '📋 نتائج اللاعبين:\n';
    
    game.players.forEach((player, index) => {
        const status = (player.role === 'spy' && spiesWon) || (player.role === 'normal' && !spiesWon) ? 'ربح' : 'خسر';
        const roleEmoji = player.role === 'spy' ? '🕵️‍♂️' : '👤';
        resultsMessage += `${index + 1}. ${player.name} ${roleEmoji} - ${status}\n`;
    });
    
    await bot.sendMessage(game.chatId, resultsMessage);
    
    // حذف اللعبة
    delete data.games[gameId];
    saveData();
}

// معالجة الشراء
async function handlePurchase(chatId, userId, text) {
    const parts = text.split(' ');
    if (parts.length < 3) return;
    
    const quantity = parseInt(parts[1]);
    const itemName = parts.slice(2).join(' ');
    
    if (!shopItems[itemName]) {
        return bot.sendMessage(chatId, 'هذا المنتج غير موجود في المتجر');
    }
    
    if (!data.users[userId]) {
        data.users[userId] = { money: 0, items: {} };
    }
    
    const totalPrice = shopItems[itemName] * quantity;
    
    if (data.users[userId].money < totalPrice) {
        return bot.sendMessage(chatId, 'ليس لديك مال كافي');
    }
    
    data.users[userId].money -= totalPrice;
    data.users[userId].items[itemName] = (data.users[userId].items[itemName] || 0) + quantity;
    
    await bot.sendMessage(chatId, `💵 لقد اشتريت ${quantity} ${itemName} بسعر ${totalPrice.toLocaleString()} د.ج\nتبقى لديك ${data.users[userId].money.toLocaleString()} د.ج`);
    
    saveData();
}

// معالجة البيع
async function handleSell(chatId, userId, text) {
    const parts = text.split(' ');
    if (parts.length < 3) return;
    
    const quantity = parseInt(parts[1]);
    const itemName = parts.slice(2).join(' ');
    
    if (!data.users[userId] || !data.users[userId].items[itemName] || data.users[userId].items[itemName] < quantity) {
        return bot.sendMessage(chatId, 'ليس لديك هذا المنتج بالكمية المطلوبة');
    }
    
    const sellPrice = Math.floor(shopItems[itemName] * quantity * 0.75);
    
    data.users[userId].money += sellPrice;
    data.users[userId].items[itemName] -= quantity;
    
    if (data.users[userId].items[itemName] === 0) {
        delete data.users[userId].items[itemName];
    }
    
    await bot.sendMessage(chatId, `💰 استرجعت ${sellPrice.toLocaleString()} د.ج (75% من المبلغ الأصلي)`);
    
    saveData();
}

// عرض ممتلكات المستخدم
async function showUserItems(chatId, userId) {
    if (!data.users[userId]) {
        return bot.sendMessage(chatId, 'ليس لديك أي ممتلكات');
    }
    
    let message = `💼 ممتلكاتك:\n💰 الرصيد: ${data.users[userId].money.toLocaleString()} د.ج\n\n`;
    
    if (Object.keys(data.users[userId].items).length === 0) {
        message += 'لا توجد منتجات';
    } else {
        Object.entries(data.users[userId].items).forEach(([item, quantity]) => {
            message += `• ${item}: ${quantity}\n`;
        });
    }
    
    await bot.sendMessage(chatId, message);
}

// عرض خيارات البنك
async function showBankOptions(chatId, userId) {
    const keyboard = {
        inline_keyboard: [
            [{ text: 'بدر', callback_data: 'bank_badr' }],
            [{ text: 'الهلال', callback_data: 'bank_hilal' }],
            [{ text: 'أويحي', callback_data: 'bank_ouihi' }]
        ]
    };
    
    await bot.sendMessage(chatId, 'اختر البنك:', { reply_markup: keyboard });
}

// معالجة التحويل
async function handleTransfer(chatId, userId, text) {
    const parts = text.split(' ');
    if (parts.length < 2) return;
    
    const amount = parseInt(parts[1]);
    
    if (!data.users[userId] || data.users[userId].money < amount) {
        return bot.sendMessage(chatId, 'ليس لديك رصيد كافي');
    }
    
    const commission = Math.floor(amount * 0.15);
    const finalAmount = amount - commission;
    
    await bot.sendMessage(chatId, `يرسل رقم حساب المستفيد لتحويل ${finalAmount.toLocaleString()} د.ج (بعد خصم عمولة 15%)`);
}

// أوامر المساعدة
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    const helpText = `🤖 أوامر البوت:

🎮 أوامر اللعبة:
/start - بدء البوت
/newgame - بدء لعبة جديدة
/help - عرض هذه القائمة

🛒 أوامر المتجر:
/shop - عرض المتجر
شراء [الكمية] [المنتج] - شراء منتج
بيع [الكمية] [المنتج] - بيع منتج
ممتلكاتي - عرض ممتلكاتك

🏦 أوامر البنك:
/bank - البنك
حلي بونكا - فتح حساب بنكي
فارسي [المبلغ] - تحويل الأموال

📊 أوامر الإحصائيات:
/profile - إحصائياتك
/stats - إحصائيات المجموعة`;

    await bot.sendMessage(chatId, helpText);
});

// أمر المتجر
bot.onText(/\/shop/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    let shopText = '🛒 متجر البوت:\n\n';
    
    Object.entries(shopItems).forEach(([item, price]) => {
        shopText += `• ${item}: ${price.toLocaleString()} د.ج\n`;
    });
    
    shopText += '\n💡 للشراء: شراء [الكمية] [المنتج]\n💡 للبيع: بيع [الكمية] [المنتج]';
    
    await bot.sendMessage(chatId, shopText);
});

// أمر الإحصائيات
bot.onText(/\/profile/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    if (!data.users[userId]) {
        data.users[userId] = { money: 0, items: {}, gamesPlayed: 0, wins: 0, spyWins: 0 };
    }

    const user = data.users[userId];
    const profileText = `📊 إحصائياتك:
💰 الرصيد: ${user.money.toLocaleString()} د.ج
🎮 الألعاب المُلعبة: ${user.gamesPlayed || 0}
🏆 الانتصارات: ${user.wins || 0}
🕵️‍♂️ انتصارات الجاسوس: ${user.spyWins || 0}`;

    await bot.sendMessage(chatId, profileText);
});

// أوامر المطور
bot.onText(/\/ban (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (userId !== developerId) return;
    
    const targetId = parseInt(match[1]);
    if (!data.banned.includes(targetId)) {
        data.banned.push(targetId);
        saveData();
        await bot.sendMessage(chatId, `تم حظر المستخدم ${targetId}`);
    }
});

bot.onText(/\/unban (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (userId !== developerId) return;
    
    const targetId = parseInt(match[1]);
    const index = data.banned.indexOf(targetId);
    if (index > -1) {
        data.banned.splice(index, 1);
        saveData();
        await bot.sendMessage(chatId, `تم إلغاء حظر المستخدم ${targetId}`);
    }
});
// أمر إنهاء اللعبة للمشرفين
bot.onText(/\/endgame/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (isBanned(userId)) {
        return bot.sendMessage(chatId, 'انت مقصي اتصل بالمطور للافراج عنك المطور: @V_b_L_o');
    }

    if (msg.chat.type === 'private') {
        return bot.sendMessage(chatId, 'هذا الأمر يعمل فقط في المجموعات');
    }

    // فحص إذا كان المستخدم مشرف
    if (!(await isAdmin(chatId, userId))) {
        return bot.sendMessage(chatId, 'هذا الأمر للمشرفين فقط');
    }

    // البحث عن اللعبة النشطة
    const activeGame = Object.entries(data.games).find(([gameId, game]) => 
        game.chatId === chatId && !['finished'].includes(game.status)
    );

    if (!activeGame) {
        return bot.sendMessage(chatId, 'لا توجد لعبة نشطة حالياً في هذه المجموعة');
    }

    const [gameId, game] = activeGame;
    const adminName = msg.from.first_name || msg.from.username || 'مشرف';

    // إنهاء اللعبة
    await forceEndGame(gameId, game, adminName, 'admin');
    
    await bot.sendMessage(chatId, `⛔ تم إنهاء اللعبة بواسطة المشرف ${adminName}`);
});

// أمر إنهاء اللعبة للمطور
bot.onText(/\/forceend/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // فحص إذا كان المستخدم هو المطور
    if (userId !== developerId) {
        return bot.sendMessage(chatId, 'هذا الأمر للمطور فقط');
    }

    if (msg.chat.type === 'private') {
        // في الخاص، عرض جميع الألعاب النشطة
        const activeGames = Object.entries(data.games).filter(([gameId, game]) => 
            !['finished'].includes(game.status)
        );

        if (activeGames.length === 0) {
            return bot.sendMessage(chatId, 'لا توجد ألعاب نشطة حالياً');
        }

        let gamesList = '🎮 الألعاب النشطة:\n\n';
        activeGames.forEach(([gameId, game], index) => {
            gamesList += `${index + 1}. المجموعة: ${game.chatId}\n`;
            gamesList += `   الحالة: ${game.status}\n`;
            gamesList += `   اللاعبين: ${game.players.length}\n`;
            gamesList += `   ID: ${gameId}\n\n`;
        });

        gamesList += 'لإنهاء لعبة محددة، استخدم: /forceend [gameId]';
        return bot.sendMessage(chatId, gamesList);
    } else {
        // في المجموعة، إنهاء اللعبة مباشرة
        const activeGame = Object.entries(data.games).find(([gameId, game]) => 
            game.chatId === chatId && !['finished'].includes(game.status)
        );

        if (!activeGame) {
            return bot.sendMessage(chatId, 'لا توجد لعبة نشطة حالياً في هذه المجموعة');
        }

        const [gameId, game] = activeGame;
        
        // إنهاء اللعبة
        await forceEndGame(gameId, game, 'المطور', 'developer');
        
        await bot.sendMessage(chatId, '⛔ تم إنهاء اللعبة بواسطة المطور');
    }
});

// أمر إنهاء لعبة محددة للمطور
bot.onText(/\/forceend (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const gameId = match[1];

    // فحص إذا كان المستخدم هو المطور
    if (userId !== developerId) {
        return bot.sendMessage(chatId, 'هذا الأمر للمطور فقط');
    }

    if (msg.chat.type !== 'private') {
        return bot.sendMessage(chatId, 'استخدم هذا الأمر في الخاص');
    }

    const game = data.games[gameId];
    if (!game) {
        return bot.sendMessage(chatId, 'اللعبة غير موجودة أو منتهية بالفعل');
    }

    // إنهاء اللعبة
    await forceEndGame(gameId, game, 'المطور', 'developer');
    
    await bot.sendMessage(chatId, `✅ تم إنهاء اللعبة ${gameId} بنجاح`);
    
    // إشعار المجموعة
    try {
        await bot.sendMessage(game.chatId, '⛔ تم إنهاء اللعبة بواسطة المطور');
    } catch (error) {
        console.log('لا يمكن إرسال إشعار للمجموعة');
    }
});

// دالة إنهاء اللعبة بالقوة
async function forceEndGame(gameId, game, adminName, adminType) {
    try {
        // إيقاف جميع المؤقتات
        if (game.checkIntervalId) {
            clearInterval(game.checkIntervalId);
        }
        if (game.timeoutId) {
            clearTimeout(game.timeoutId);
        }

        // تحديث حالة اللعبة
        game.status = 'force_ended';
        game.endTime = Date.now();
        game.endedBy = adminName;
        game.endType = adminType;

        // إرسال ملخص اللعبة إذا كانت بدأت
        if (game.currentItem && game.players.length > 0) {
            let summaryMessage = `📋 ملخص اللعبة المُنهاة:\n\n`;
            summaryMessage += `${game.gameType === 'items' ? '📦 الشيء' : '📍 المكان'}: ${game.currentItem}\n\n`;
            summaryMessage += `👥 اللاعبون (${game.players.length}):\n`;
            
            game.players.forEach((player, index) => {
                const roleEmoji = player.role === 'spy' ? '🕵️‍♂️' : '👤';
                summaryMessage += `${index + 1}. ${player.name} ${roleEmoji}\n`;
            });

            summaryMessage += `\n⛔ تم إنهاء اللعبة بواسطة ${adminName}`;

            try {
                await bot.sendMessage(game.chatId, summaryMessage);
            } catch (error) {
                console.log('لا يمكن إرسال ملخص اللعبة');
            }
        }

        // حذف اللعبة من البيانات
        delete data.games[gameId];
        saveData();

        console.log(`تم إنهاء اللعبة ${gameId} بواسطة ${adminName} (${adminType})`);

    } catch (error) {
        console.error('خطأ في إنهاء اللعبة:', error);
        throw error;
    }
}

// أمر عرض جميع الألعاب النشطة (للمطور)
bot.onText(/\/games/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== developerId) {
        return bot.sendMessage(chatId, 'هذا الأمر للمطور فقط');
    }

    const activeGames = Object.entries(data.games).filter(([gameId, game]) => 
        !['finished', 'force_ended'].includes(game.status)
    );

    if (activeGames.length === 0) {
        return bot.sendMessage(chatId, 'لا توجد ألعاب نشطة حالياً');
    }

    let gamesList = `🎮 الألعاب النشطة (${activeGames.length}):\n\n`;
    activeGames.forEach(([gameId, game], index) => {
        const duration = game.startTime ? 
            Math.floor((Date.now() - game.startTime) / 60000) : 0;
        
        gamesList += `${index + 1}. ID: ${gameId}\n`;
        gamesList += `   📍 المجموعة: ${game.chatId}\n`;
        gamesList += `   📊 الحالة: ${game.status}\n`;
        gamesList += `   👥 اللاعبين: ${game.players.length}\n`;
        gamesList += `   ⏱️ المدة: ${duration} دقيقة\n`;
        gamesList += `   🎯 النوع: ${game.gameType || 'غير محدد'}\n\n`;
    });

    gamesList += '💡 لإنهاء لعبة: /forceend [gameId]';
    await bot.sendMessage(chatId, gamesList);
});

// أمر تنظيف الألعاب المنتهية (للمطور)
bot.onText(/\/cleanup/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== developerId) {
        return bot.sendMessage(chatId, 'هذا الأمر للمطور فقط');
    }

    const beforeCount = Object.keys(data.games).length;
    
    // تنظيف الألعاب القديمة
    cleanupGames();
    
    const afterCount = Object.keys(data.games).length;
    const cleanedCount = beforeCount - afterCount;

    await bot.sendMessage(chatId, 
        `🧹 تم تنظيف ${cleanedCount} لعبة منتهية\n` +
        `📊 الألعاب المتبقية: ${afterCount}`
    );
});
// بدء البوت
console.log('🤖 بوت Spyfall يعمل الآن...');

// حفظ البيانات كل 5 دقائق
setInterval(saveData, 5 * 60 * 1000);

// معالجة الأخطاء
process.on('unhandledRejection', (reason, promise) => {
    console.log('خطأ غير معالج:', reason);
});

process.on('uncaughtException', (error) => {
    console.log('خطأ غير متوقع:', error);
});

