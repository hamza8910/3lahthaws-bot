const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const config = require('./config');

class GameLogic {
  constructor() {
    this.activeGames = new Map();
    this.gameTimers = new Map();
    this.joinTimers = new Map();
    
    // قائمة الأماكن -
    this.locations = [ 'مدرسة' 🏫 'ثانوية' 🎒 'ابتدائية' 📚 'روض أطفال' 👶 'جامعة' 🎓 'كلية' 🏫 'معهد' 🏢 'مكتبة' 📚 'مختبر' 🔬 'مركز تدريب' 🏋️‍♂️
'مستشفى' 🏥 'عيادة' 🏩 'صيدلية' 💊 'مركز طوارئ' 🚑 'مركز صحي' 🏥 'مخبر تحاليل' 🧪 'مركز توليد' 🤰 'عيادة أسنان' 😁 'مركز إعادة تأهيل' ♿ 'مركز لقاح' 💉
'محكمة' ⚖️ 'سجن' 🚔 'بلدية' 🏢 'ولاية' 🏛️ 'قصر العدالة' ⚖️ 'مركز شرطة' 🚔 'دار بلدية' 🏢 'مركز بريد' 📮 'مركز الجمارك' 🛃 'قنصلية' 🏛️
'سفارة' 🏛️ 'مبنى البرلمان' 🏛️ 'وزارة' 🏛️ 'دار الثقافة' 🏛️ 'قصر ثقافة' 🏛️ 'مركز شباب' 🏠 'دار شباب' 🏠 'مركز اجتماعي' 🏠 'قاعة محاضرات' 🎤 'قاعة مؤتمرات' 🏢
'مسجد' 🕌 'كنيسة' ⛪ 'كاتدرائية' 🕍 'معبد' 🛕 'زاوية' 🕌 'ضريح' ⚰️ 'مزار' 🕌 'مقبرة' ⚰️ 'دار القرآن' 📖 'مركز تحفيظ' 📖
'سينما' 🎬 'مسرح' 🎭 'قاعة موسيقى' 🎼 'نادي ليلي' 💃 'قاعة حفلات' 🎉 'مدينة ملاهي' 🎢 'حديقة حيوانات' 🐾 'أكواريوم' 🐠 'منتزه' 🌳 'حديقة عامة' 🌲
'حلبة تزلج' ⛸️ 'ملعب كرة قدم' ⚽ 'ملعب كرة سلة' 🏀 'ملعب تنس' 🎾 'ملعب جليد' 🏒 'صالة رياضة' 🏋️ 'صالة بولينغ' 🎳 'نادي سباحة' 🏊‍♂️ 'مسبح' 🏊‍♂️ 'مضمار' 🏃‍♂️
'مطعم' 🍽️ 'مطعم سريع' 🍔 'مقهى' ☕ 'مخبز' 🍞 'محل مثلجات' 🍨 'محل حلويات' 🍰 'محل قهوة' ☕ 'كشك' 🏪 'سوبرماركت' 🛒 'سوق' 🛒
'بازار' 🛍️ 'مول تجاري' 🛍️ 'متجر كتب' 📚 'محل ملابس' 👗 'محل أحذية' 👞 'محل مجوهرات' 💍 'صالون حلاقة' 💈 'صالون تجميل' 💅 'محل هواتف' 📱 'محل حيوانات' 🐶
'فندق' 🏨 'نزل' 🛌 'منتجع' 🏝️ 'نُزل شباب' 🛏️ 'دار ضيافة' 🏡 'شاليه' 🏘️ 'مخيم' ⛺ 'كوخ' 🛖 'بيت جبلي' 🏠 'قرية سياحية' 🏘️
'مطار' 🛫 'محطة قطار' 🚉 'محطة مترو' 🚇 'محطة ترام' 🚋 'محطة حافلات' 🚌 'موقف سيارات' 🅿️ 'مرآب' 🅿️ 'مركز سيارات' 🚗 'محطة وقود' ⛽ 'محطة شحن' ⚡
'ميناء' ⚓ 'رصيف' 🚢 'حوض جاف' 🛠️ 'مرسى' 🚤 'مرفأ صيد' 🐟 'مطار بحري' 🛥️ 'مركز تحكم جوي' 🛩️ 'نفق' 🚇 'جسر' 🌉 'طريق سريع' 🛣️
'إشارة مرور' 🚦 'دوار' 🔄 'موقف دراجات' 🚲 'مسار دراجات' 🚲 'رصيف مشاة' 🚶 'جادة' 🌳 'شارع رئيسي' 🛣️ 'زقاق' 🏘️ 'ساحة' 🏙️ 'ميدان' 🏢
'برج' 🗼 'ناطحة سحاب' 🏙️ 'عمارة' 🏢 'فيلا' 🏠 'قصر' 🏰 'قلعة' 🏰 'حصن' 🏰 'برج مراقبة' 🗼 'برج ساعة' 🕰️ 'منارة' 🌊
'متحف' 🏛️ 'معرض فن' 🖼️ 'صالة عرض' 🖼️ 'بيت تراثي' 🏚️ 'موقع أثري' 🏺 'مكتبة وطنية' 📚 'دار أرشيف' 🗂️ 'قاعة تذكارية' 🕯️ 'مركز زوار' 🗺️ 'بيت ثقافة' 🏛️
'مختبر علوم' 🔬 'محطة أبحاث' 🧪 'مرصد فلكي' 🔭 'مركز ابتكار' 💡 'حاضنة أعمال' 🚀 'مركز بيانات' 🖥️ 'مركز اتصالات' 📞 'مركز أمن سيبراني' 🛡️ 'حقل شمسي' ☀️ 'مزرعة رياح' 🌬️
'مصنع' 🏭 'مصفاة' 🛢️ 'مخبز صناعي' 🍞 'محلج قطن' 🌾 'معمل نسيج' 🧵 'معمل أدوية' 💊 'معمل غذائي' 🍱 'ورشة حدادة' ⚒️ 'ورشة نجارة' 🪚 'ورشة ميكانيك' 🔧
'محطة كهرباء' 🔌 'محطة غاز' ⛽ 'محطة مياه' 💧 'سد' 🏗️ 'خزان ماء' 🫗 'برج تبريد' 🌫️ 'حقل نفط' 🛢️ 'بئر غاز' ⛽ 'منجم' ⛏️ 'مقلع حجر' 🪨
'مزرعة' 🚜 'بيت زجاجي' 🌱 'حقل' 🌾 'بستان' 🍏 'كرم عنب' 🍇 'مشتل' 🌿 'حضيرة أبقار' 🐄 'اسطبل' 🐎 'حظيرة دجاج' 🐔 'مزرعة نحل' 🐝
'منطقة رطبة' 🐦 'محمية طبيعية' 🌳 'حديقة وطنية' 🌲 'غابة' 🌳 'شلال' 💦 'بحيرة' 🏞️ 'نهر' 🌊 'وادي' 🏞️ 'جبل' 🏔️ 'صحراء' 🏜️
'كهف' 🕳️ 'جزيرة' 🏝️ 'شبه جزيرة' 🌊 'مضيق' 🌊 'شاطئ' 🏖️ 'رأس ساحلي' ⛰️ 'دلتا' 🌅 'سهل' 🌾 'هضبة' 🏔️ 'تل' ⛰️
'منتجع تزلج' 🎿 'حمام معدني' ♨️ 'حمام تركي' 🛀 'سبا' 🧖‍♀️ 'مركز تدليك' 💆 'مركز يوغا' 🧘‍♀️ 'نادي لياقة' 🏋️ 'مركز رماية' 🎯 'ميدان رماية' 🎯 'نادي رماية' 🎯
'ورشة عمل' 🛠️ 'مركز خياطة' 🪡 'مسبك' 🔩 'مصنع سيارات' 🚗 'محطة تجميع' 🏗️ 'مركز تعبئة' 📦 'مستودع' 🏚️ 'مخزن تبريد' ❄️ 'مركز لوجستي' 🚚 'مركز توزيع' 🚛
'استوديو تصوير' 📷 'غرفة تسجيل' 🎙️ 'محطة إذاعة' 📻 'محطة تلفزيون' 📺 'سينما ثلاثية' 📽️ 'مركز مونتاج' 🎞️ 'قاعة تحرير' 📰 'مسرح عرائس' 🪆 'قبة سينمائية' 🌌 'قاعة عرض افتراضي' 🕶️
'مختبر حاسوب' 💻 'مركز روبوتات' 🤖 'مركز ذكاء اصطناعي' 🧠 'مركز ابتكار رقمي' 📱 'مسرح واقع' 🕶️ 'قاعة ألعاب' 🎮 'مقهى إنترنت' 💻 'مركز لغات' 🈳 'معهد موسيقى' 🎹 'معهد رقص' 💃
'دار أيتام' 👶 'دار مسنين' 🧓 'مركز إعاقة' ♿ 'مركز توحد' 🧩 'بيت شؤون اجتماعية' 🏠 'مركز استشارات' 🗣️ 'محطة تحلية' 💧 'محطة فرز نفايات' ♻️ 'مكب نفايات' 🗑️ 'محطة إعادة تدوير' ♻️
'مرصد زلازل' 🌋 'محطة أرصاد' 🌦️ 'مرصد جوي' 🌤️ 'برج مراقبة جوية' 🛩️ 'مركز إنذار مبكر' 🚨 'مركز إطفاء' 🚒 'مركز إنقاذ' 🚑 'حوض سباحة أولمبي' 🏊‍♂️ 'مضمار سباق' 🏎️ 'حلبة خيل' 🐎
'مرآب دراجات' 🚲 'مكتب تأجير سيارات' 🚗 'محطة تاكسي' 🚕 'مرسى يخوت' 🚤 'مرفأ عبّارات' ⛴️ 'محطة كابل' 🚡 'محطة تلفريك' 🚠 'مطار مروحيات' 🚁 'مهبط' 🛬 'برج مطار' 🛫
'مختبر لغوي' 🗣️ 'مركز إمتحانات' 📝 'قاعة دراسة' 📖 'فصل دراسي' 🏫 'مركز دعم مدرسي' 🧑‍🏫 'مركز أبحاث تربوية' 🎓 'مركز مصادر تعلم' 📚 'معرض كتب' 📚 'صالون سيارات' 🚗 'سوق أسبوعي' 🛒
'مركز تسوق إلكتروني' 💻 'حاضنة أعمال ناشئة' 🚀 'فضاء عمل مشترك' 🧑‍💼 'مسرح في الهواء' 🌌 'سينما سيارات' 🚗 'مكتبة متنقلة' 🚐 'بازار ليلي' 🌙 'شارع فني' 🎨 'مهرجان' 🎪 'ساحة عروض' 🎆
  ];
    
    // قائمة الأشياء - 
    this.items = [ 'الكسكس' 🍲 'الطاجين' 🍲 'الشوربة' 🍜 'الرشتة' 🍝 'المحاجب' 🫓 'المقرمشات' 🍘 'الشخشوخة' 🍲 'المقروط' 🍪 'الغرس' 🌴 'دقلة نور' 🌴
'قندورة' 👗 'برنوس' 🧥 'جلابية' 👘 'بلوزة وهرانية' 👚 'ملحفة' 🧣 'سروال علاوي' 🩳 'شاش' 🩲 'سلهام' 🧣 'جبادور' 👕 'كقاط' 🧥
'زربية' 🧶 'فخار' 🏺 'خزف' 🏺 'نحاس' 🔔 'جلد طبيعي' 👝 'سعف نخيل' 🧺 'منسج' 🪢 'مخرمة' 🧵 'مشربية' 🪟 'نول تقليدي' 🪡
'خط عربي' ✒️ 'منمنمة' 🎨 'مخطوط' 📜 'قصبة موسيقية' 🏰 'رقصة العلاوي' 💃 'رقصة القناوي' 🕺 'رقصة العلاوي' 💃 'الراي' 🎤 'الشعبي' 🎶 'أندلسي' 🎻
'قانون' 🎹 'دربوكة' 🪘 'بندير' 🥁 'ربابة' 🎻 'ناي' 🎶 'مزمار' 🎶 'طنبور' 🪕 'قيتار' 🎸 'كمان' 🎻 'غيطة' 🎺
'كرة القدم' ⚽ 'كرة اليد' 🤾‍♂️ 'كرة السلة' 🏀 'الملاكمة' 🥊 'الجودو' 🥋 'الكاراتيه' 🥋 'السباحة' 🏊‍♂️ 'ألعاب القوى' 🏃‍♂️ 'الدراجات' 🚴‍♀️ 'الرماية' 🎯
'نفط' 🛢️ 'غاز' ⛽ 'حديد' ⚙️ 'فوسفات' 🧪 'فلين' 🪵 'ملح' 🧂 'رخام' 🪨 'فلوريت' 🟣 'خيط حرير' 🧵 'صوف' 🐑
'زيتون' 🫒 'تمور' 🌴 'صنوبر' 🌲 'عرعار' 🌳 'زعتر' 🌿 'ورد دمشق' 🌹 'زعفران' 🧂 'إثل' 🌳 'خبز الشعير' 🍞 'عسل' 🍯
'ثعلب الصحراء' 🦊 'غزال' 🦌 'فهد صحراوي' 🐆 'ذئب' 🐺 'فنكل' 🦊 'ضبع' 🐾 'جمل' 🐪 'حصان عربي' 🐎 'ماعز جبلي' 🐐 'نعامة' 🦩
'صقر' 🦅 'باز' 🦅 'يمامة' 🕊️ 'طاووس' 🦚 'ببغاء' 🦜 'أسد الأطلس' 🦁 'قرد مكاك' 🐒 'ضفدع أخضر' 🐸 'سلحفاة' 🐢 'سمك بوري' 🐟
'نجمة وهلال' 🌟 'نخلة' 🌴 'صحراء' 🏜️ 'جبال' ⛰️ 'بحر' 🌊 'شمس' ☀️ 'قمر' 🌙 'قنديل' 🏮 'برقوق' 🍑 'تمر هند' 🍹
'راية وطنية' 🇩🇿 'النشيد الوطني' 🎵 'شعار الدولة' 🦅 'الختم الرسمي' 🔏 'دستور' 📜 'جواز سفر' 📘 'عملات معدنية' 🪙 'دينار' 💰 'طابع بريدي' 📮 'بطاقة تعريف' 🪪
'حكمة شعبية' 💭 'مثل' 💬 'لغز' ❓ 'أسطورة' 🐉 'حكاية شعبية' 📚 'شعر ملحون' 📝 'قصيدة' 🖋️ 'موشح' 🎶 'مقام' 🎼 'إيقاع' 🪘
'تراث' 🏺 'آثار' 🏛️ 'مخطوط قديم' 📜 'متحف' 🖼️ 'مسرح' 🎭 'سينما' 🎬 'كتاب' 📖 'رواية' 📚 'مجلة' 📔 'صحيفة' 📰
'تاريخ' 📅 'ثورة نوفمبر' 🎖️ 'بيان أول نوفمبر' 📜 'مجاهد' 🪖 'شهيد' ✝️ 'مجذوب' 🧙‍♂️ 'زاوية' 🕌 'قصبة' 🏰 'حصن' 🛡️ 'ضريح' ⚰️
'ماء زمزم' 💧 'حناء' 🌿 'كحل' 🖤 'عطور' 🧴 'عقود فضة' 💍 'حلي أمازيغي' 💎 'خلخال' 🦶 'وشاح' 🧣 'قلادة' 📿 'سوار' 🪔
'موزاييك' 🎨 'فسيفساء' 🖼️ 'نقش حجري' 🗿 'جص' 🧱 'قرميد' 🧱 'طين' 🧱 'نقش جبسي' 🎨 'زخرفة' 🖌️ 'خط كوفي' ✒️ 'خط ديواني' 🖋️
'معرض الكتاب' 📚 'صالون السيارات' 🚗 'عيد الفطر' 🎈 'عيد الأضحى' 🐑 'المولد النبوي' 🕌 'رأس السنة الأمازيغية' 🎉 'عاشوراء' 🔥 'يوم الطالب' 🎓 'عيد الاستقلال' 🎇 'يوم العلم' 📖
'طبق اللاجوج' 🍲 'مغربية' 🍚 'مسفوف' 🍚 'حريرة' 🍲 'زويتة' 🍵 'محمص' 🍛 'طاجين الزيتون' 🍲 'بغرير' 🥞 'فطير' 🫓 'قريوش' 🍘
'خيمة' ⛺ 'زرابي مزينة' 🧶 'موقد نار' 🔥 'مسبحة' 📿 'سبحة' 📿 'خنجر' 🗡️ 'بارود' 💥 'بندقية قديمة' 🔫 'سيف' ⚔️ 'درع' 🛡️
'لويزة' 🌼 'إكليل الجبل' 🌿 'مرمية' 🌿 'قرنفل' 🌸 'بابونج' 🌼 'حبة البركة' 🌑 'يانسون' 🌿 'قرفة' 🌿 'فلفل أحمر' 🌶️ 'كمون' 🌿
'شاي بالنعناع' 🍵 'قهوة تركية' ☕ 'لبن' 🥛 'رايب' 🥛 'مشروب اللاقمي' 🥤 'شراب الورد' 🍹 'حليب التمر' 🥛 'عصير البرتقال' 🍊 'عصير التفاح' 🍏 'ماء الشعير' 🥤
'طابع تقليدي' 🎨 'نقش بالحرقوس' 🖌️ 'وشم أمازيغي' ✒️ 'زينة الحناء' 🌿 'موروث شفهي' 🗣️ 'لغة الدارجة' 🗨️ 'لغة الشاوية' 🗣️ 'لغة القبائل' 🗣️ 'لغة المزابية' 🗣️ 'لغة الترڤية' 🗣️
'قناة تلفزيونية' 📺 'إذاعة' 📻 'فيلم جزائري' 🎞️ 'أغنية وطنية' 🎵 'برنامج رمضاني' 📺 'مسلسل درامي' 🎬 'رسوم متحركة' 🖥️ 'مسرحية' 🎭 'سهرة فنية' 🎤 'نشرة أخبار' 📰
'خط مترو' 🚇 'ترامواي' 🚋 'حافلة' 🚌 'سيارة أجرة' 🚕 'دراجة نارية' 🏍️ 'دراجة هوائية' 🚲 'قطار' 🚆 'سفينة' 🚢 'طائرة' ✈️ 'مطار' 🛫
'ميناء' ⚓ 'طريق سريع' 🛣️ 'جسر' 🌉 'نفق' 🚇 'ساحة عمومية' 🏟️ 'نصب تذكاري' 🗿 'حديقة عامة' 🌳 'نافورة' ⛲ 'إنارة عمومية' 💡 'موقف سيارات' 🅿️
'بطاقة الشفاء' 💳 'بطاقة بنكية' 💳 'أوراق نقدية' 💵 'إيصال' 🧾 'طابع ضريبي' 🧾 'ختم بريدي' 📮 'رسالة' ✉️ 'برقية' 📨 'طرد' 📦 'شحنة' 🚚
'محرك ديزل' ⚙️ 'مولد كهرباء' 🔌 'توربين غاز' ⚡ 'ألواح شمسية' ☀️ 'طاحونة هواء' 🌬️ 'سد' 🏗️ 'محطة تحلية' 💧 'قناة ري' 🚰 'بئر' ⛲ 'خزان ماء' 🫗
'مكتبة' 📚 'مختبر' 🔬 'جامعة' 🎓 'مدرسة' 🏫 'معهد' 🏢 'مركز تدريب' 🏫 'ورشة عمل' 🛠️ 'مصنع' 🏭 'مخبز' 🍞 'مطحنة' 🛞
'بوغاز' 🌊 'خور' 🌊 'وادي' 🏞️ 'عرق رملي' 🏜️ 'هضبة' 🏔️ 'سهول' 🌾 'غابة' 🌲 'شلال' 💦 'كهوف' 🕳️ 'نتوء صخري' 🗻
'قافلة' 🐪 'دوار' 🛖 'خربة' 🏚️ 'بيوت طينية' 🏡 'سور' 🚧 'بوابة' 🚪 'محراب' 🕌 'منبر' 🕌 'مئذنة' 🕌 'قبة' 🕌
'صناعة تقليدية' 🧵 'حرفي' 👨‍🔧 'بازار' 🛍️ 'سوق أسبوعي' 🛒 'مزاد' 🔨 'عطار' 🧂 'حداد' ⚒️ 'نجار' 🪚 'خباز' 🧑‍🍳 'صائغ' 💍
'حرف نحاسية' 🔔 'قفة' 🧺 'سجاد' 🪑 'مصنوعات خشبية' 🪑 'زجاج معشق' 🪟 'مصوغات فضية' 💍 'خيمة بدوية' ⛺ 'موقد فحم' 🔥 'طنجرة طين' 🍲 'سراج زيت' 🪔
'أدب' 📖 'رواية' 📚 'قصة قصيرة' 📗 'مقالة' 📄 'عمود صحفي' 📰 'دراسة أكاديمية' 🎓 'بحث علمي' 📑 'كتاب تاريخ' 📘 'معجم' 📕 'ديوان شعر' 📔
'لوحة زيتية' 🎨 'رسم بالأكواريل' 🖌️ 'جرافيتي' 🎨 'فن تجريدي' 🖼️ 'بورتريه' 🖼️ 'نحت رخامي' 🗿 'تمثال برونزي' 🗿 'ترصيع' 🪶 'فسيفساء حجرية' 🖼️ 'خطاط' 🖋️
'برنامج إذاعي' 📻 'بودكاست' 🎧 'حملة توعية' 📢 'ملصق' 🖼️ 'إعلان' 📢 'شعار' 🏷️ 'جريدة إلكترونية' 💻 'موقع إخباري' 🖥️ 'تطبيق ذكي' 📱 'حساب رسمي' 🔖
'خريطة' 🗺️ 'إحصاء' 📊 'تعداد سكاني' 👨‍👩‍👧‍👦 'قانون مدني' 📜 'مرسوم' 📜 'قرار وزاري' 📑 'تشريع' 📜 'رخصة' 🪪 'وصل' 🧾
'نقطة شرطة' 🚔 'ثكنة' 🪖 'مستشفى' 🏥 'عيادة' 🏩 'صيدلية' 💊 'إسعاف' 🚑 'إطفاء' 🚒 'محكمة' ⚖️ 'سجن' 🚔 'مركز بريد' 📮
'حديقة حيوانات' 🐾 'محمية طبيعية' 🌳 'مرجان' 🪸 'حيد بحري' 🐠 'رمل ذهبي' 🏖️ 'صخرة الفيل' 🪨 'طلائع نباتية' 🌱 'مناخ متوسطي' 🌤️ 'مناخ صحراوي' 🏜️ 'مناخ جبلي' 🌨️
'صبغة نيلية' 🟦 'طباعة تقليدية' 🖨️ 'ورق بردي' 📜 'قراءة جماعية' 📖 'حلقة ذكر' 🕋 'أذان' 📣 'خطبة' 📜 'درس فقهي' 📖 'فتوى' 📜 'سند قبلي' 📜
'شارة' 🏷️ 'وسام' 🎖️ 'ميدالية' 🏅 'كأس' 🏆 'لوحة شرف' 🏅 'دبلوم' 📜 'شهادة' 📜 'اعتماد' 📄 'بطاقة حضور' 🎟️ 'دعوة' 💌
'كاميرا' 📷 'ميكروفون' 🎙️ 'إضاءة مسرح' 💡 'منصة' 🎤 'ستارة' 🩰 'ديكور' 🎭 'مؤثرات صوتية' 🔊 'موسيقى تصويرية' 🎼 'مونتاج' 🎞️ 'سيناريو' 📑
'خط سكة' 🚂 'محطة قطار' 🚉 'عربة نوم' 🚃 'تذكرة' 🎫 'أجرة' 💵 'محول كهرباء' 🔌 'مصباح' 💡 'مفتاح' 🔑 'قفل' 🔒 'جهاز إنذار' 🚨
'لوحة مفاتيح' ⌨️ 'فأرة' 🖱️ 'قرص صلب' 💾 'معالج' 🖥️ 'بطاقة رسومية' 🖥️ 'ذاكرة' 📀 'شاشة' 🖥️ 'طابعة' 🖨️ 'ماسح ضوئي' 📠 'راوتر' 📡
'برمجيات' 💽 'نظام تشغيل' 🖥️ 'تطبيق ويب' 🌐 'تطبيق جوال' 📱 'ذكاء اصطناعي' 🤖 'تعلم آلي' 🧠 'تحليل بيانات' 📊 'تخزين سحابي' ☁️ 'تشفير' 🔐 'أمن سيبراني' 🛡️
'حقيبة ظهر' 🎒 'محفظة' 👝 'مظلة' ☂️ 'نظارات شمسية' 🕶️ 'ساعة يد' ⌚ 'حزام' 🧢 'قبعة' 🎩 'قفازات' 🧤 'حذاء جلدي' 👞 'جوارب صوفية' 🧦
'دراجة رباعية' 🏎️ 'سيارة رباعية' 🚙 'شاحنة' 🚚 'رافعة' 🏗️ 'حافلة مدرسية' 🚌 'سيارة إسعاف' 🚑 'سيارة إطفاء' 🚒 'زورق' 🚤 'طائرة شراعية' 🪂 'مظلي' 🪂
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
