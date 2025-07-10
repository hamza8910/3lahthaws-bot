import telebot
import random
import time
import json
import threading
from datetime import datetime, timedelta
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, BotCommand

# إعداد البوت
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
DEVELOPER_ID = "6680350152"  # ضع هنا الـ ID الخاص بك
bot = telebot.TeleBot(BOT_TOKEN)

# متغيرات عامة
game_sessions = {}
user_accounts = {}
banned_users = set()
user_inventory = {}

# قوائم الأماكن والأشياء - ضع هنا القوائم الخاصة بك
places = [
"مدرسة 🏫", "جامعة 🎓", "منجم ⛏️", "مكتبة 📚", "مستشفى 🏥", "ملعب ⚽", "مطار 🛫", "محطة قطار 🚉", "حديقة 🌳", "مسجد 🕌",
"كنيسة ⛪", "معبد 🕍", "سوق 🛒", "مطعم 🍽️", "مقهى ☕", "مسرح 🎭", "سينما 🎬", "متحف 🖼️", "معمل 🏭", "مخبز 🍞",
"مسبح 🏊", "شاطئ 🏖️", "جبل 🏔️", "وادي 🏞️", "غابة 🌲", "مزرعة 🚜", "موقف سيارات 🅿️", "محكمة ⚖️", "مركز شرطة 🚓", "محطة وقود ⛽",
"فندق 🏨", "نزل 🏩", "شقة 🏢", "برج 🗼", "ساحة عامة 🏟️", "مكتبة عامة 📖", "مركز تسوق 🏬", "مركز رياضي 🏋️", "صالة ألعاب 🎮", "مركز مؤتمرات 🏛️",
"مطار خاص 🛩️", "مرفأ 🚢", "ميناء ⚓", "سفينة 🚢", "قارب 🚣", "جزيرة 🏝️", "سد 🏞️", "بحيرة 🏞️", "نهر 🌊", "شلال 💦",
"كهف 🕳️", "مغارة 🕳️", "محمية طبيعية 🦁", "حديقة حيوانات 🦓", "حديقة نباتية 🌺", "مشتل نباتات 🌱", "مزرعة دواجن 🐔", "مزرعة أبقار 🐄", "مزرعة نحل 🐝", "مزرعة أسماك 🐟",
"مصنع سيارات 🚗", "مصنع أدوية 💊", "مصنع أغذية 🍔", "مصنع نسيج 🧵", "مصنع إسمنت 🏗️", "مصنع حديد 🏭", "محطة كهرباء ⚡", "محطة مياه 💧", "محطة معالجة ♻️", "مصفاة نفط 🛢️",
"مركز بريد 📮", "مركز اتصالات 📞", "مركز شرطة مرور 🚦", "مركز إطفاء 🚒", "مركز إسعاف 🚑", "مركز صحي 🏥", "مركز أطفال 👶", "دار مسنين 👵", "مركز شباب 🧑‍🤝‍🧑", "مركز ثقافي 🎨",
"مركز تدريب 🏫", "مركز أبحاث 🔬", "مختبر علمي 🧪", "مركز فضاء 🛰️", "مرصد فلكي 🔭", "مركز طيران ✈️", "مركز ملاحة 🚤", "مركز غواصين 🤿", "مركز تسلق 🧗", "مركز سباق 🏎️",
"مركز تسوق إلكتروني 💻", "مركز صيانة 🛠️", "مركز شحن 📦", "مركز توزيع 🚚", "مركز جمركي 🛃", "مركز حدودي 🛂", "مركز شرطة حدود 🚔", "مركز مراقبة 🕵️", "مركز أمن 🛡️", "مركز حماية مدنية 🧑‍🚒",
"مركز إيواء 🏚️", "مركز إرشاد 📢", "مركز توجيه 🧭", "مركز استقبال 🛎️", "مركز إغاثة 🆘", "مركز إحصاء 📊", "مركز تسجيل 📝", "مركز توظيف 👔", "مركز خدمات عامة 🏢", "مركز دعم فني 🖥️",
"مركز إبداع 💡", "مركز تطوير 👨‍💻", "مركز برمجة 🖱️", "مركز رسم 🎨", "مركز موسيقى 🎵", "مركز رقص 💃", "مركز تصوير 📸", "مركز إعلامي 📰", "مركز بث 📡", "مركز إذاعة 📻",
"مركز تلفزيون 📺", "مركز أفلام 🎞️", "مركز ألعاب فيديو 🕹️", "مركز روبوتات 🤖", "مركز ذكاء اصطناعي 🧠", "مركز ريادة أعمال 🚀", "مركز أعمال 🏢", "مركز تجارة 🏦", "مركز استثمار 💸", "مركز تمويل 💰",
"مركز تأمين 🛡️", "مركز محاسبة 📈", "مركز استشارات 💼", "مركز قانوني ⚖️", "مركز ترجمة 🌐", "مركز لغات 🈳", "مركز تعليم 🏫", "مركز دروس خصوصية 📚", "مركز امتحانات 📝", "مركز منح دراسية 🎓",
"مركز رياض أطفال 🧸", "مركز حضانة 👶", "مركز تدريب مهني 🛠️", "مركز طباعة 🖨️", "مركز نسخ 📠", "مركز تصوير مستندات 📑", "مركز توصيل 🛵", "مركز نقل جماعي 🚌", "مركز سيارات أجرة 🚕", "مركز دراجات 🚲",
"مركز تأجير سيارات 🚙", "مركز إصلاح سيارات 🛠️", "مركز غسيل سيارات 🚗", "مركز بيع سيارات 🚘", "مركز بيع دراجات 🏍️", "مركز بيع قطع غيار 🧰", "مركز بيع أجهزة كهربائية 🖨️", "مركز بيع هواتف 📱", "مركز بيع ملابس 👗", "مركز بيع أحذية 👟",
"مركز بيع كتب 📚", "مركز بيع أدوات مدرسية 📝", "مركز بيع أدوات رياضية 🏀", "مركز بيع ألعاب 🧸", "مركز بيع أدوات منزلية 🏠", "مركز بيع أثاث 🛋️", "مركز بيع زهور 🌹", "مركز بيع هدايا 🎁", "مركز بيع مجوهرات 💍", "مركز بيع ساعات ⌚",
"مركز بيع نظارات 🕶️", "مركز بيع عطور 🌸", "مركز بيع مستحضرات تجميل 💄", "مركز بيع أدوية 💊", "مركز بيع أغذية 🥫", "مركز بيع فواكه 🍎", "مركز بيع خضار 🥦", "مركز بيع لحوم 🍖", "مركز بيع أسماك 🐟", "مركز بيع خبز 🍞",
"مركز بيع حلويات 🍰", "مركز بيع مشروبات 🥤", "مركز بيع قهوة ☕", "مركز بيع شاي 🍵", "مركز بيع عسل 🍯", "مركز بيع تمور 🌴", "مركز بيع مكسرات 🥜", "مركز بيع توابل 🌶️", "مركز بيع زيوت 🫒", "مركز بيع ألبان 🥛",
"مركز بيع جبن 🧀", "مركز بيع بيض 🥚", "مركز بيع دجاج 🐔", "مركز بيع أدوات مطبخ 🍳", "مركز بيع أدوات كهربائية 🔌", "مركز بيع أدوات بناء 🧱", "مركز بيع أدوات زراعية 🌾", "مركز بيع أدوات صناعية 🏭", "مركز بيع أدوات مكتبية 🖊️", "مركز بيع أدوات فنية 🎨",
"مركز بيع أدوات موسيقية 🎸", "مركز بيع أدوات صيد 🎣", "مركز بيع أدوات رحلات 🏕️", "مركز بيع أدوات رياضية 🏓", "مركز بيع أدوات سباحة 🏊", "مركز بيع أدوات تسلق 🧗", "مركز بيع أدوات تزلج 🎿", "مركز بيع أدوات غوص 🤿", "مركز بيع أدوات صيانة 🛠️", "مركز بيع أدوات حماية 🦺",
"مركز بيع أدوات إطفاء 🔥", "مركز بيع أدوات إسعاف 🚑", "مركز بيع أدوات أمنية 🛡️", "مركز بيع أدوات مراقبة 🎥", "مركز بيع أدوات إنذار 🚨", "مركز بيع أدوات طبية 🩺", "مركز بيع أدوات تعليمية 📚", "مركز بيع أدوات ترفيهية 🎲", "مركز بيع أدوات زينة 🎀", "مركز بيع أدوات احتفالات 🎉",
"مركز بيع أدوات تصوير 📷", "مركز بيع أدوات رسم 🖌️", "مركز بيع أدوات كتابة ✍️", "مركز بيع أدوات حلاقة 💈", "مركز بيع أدوات تجميل 💅", "مركز بيع أدوات عناية شخصية 🧴", "مركز بيع أدوات تنظيف 🧽", "مركز بيع أدوات غسيل 🧺", "مركز بيع أدوات كيّ 🧼", "مركز بيع أدوات ترتيب 🧹",
"مركز بيع أدوات طبخ 🍲", "مركز بيع أدوات خبز 🍞", "مركز بيع أدوات شوي 🍖", "مركز بيع أدوات قلي 🍳", "مركز بيع أدوات تقطيع 🔪", "مركز بيع أدوات خلط 🥣", "مركز بيع أدوات تقديم 🍽️", "مركز بيع أدوات تخزين 🗄️", "مركز بيع أدوات تغليف 📦", "مركز بيع أدوات شحن 🚚",
"مركز بيع أدوات سفر 🧳", "مركز بيع أدوات تخييم ⛺", "مركز بيع أدوات صيد 🐟", "مركز بيع أدوات تسلق 🧗", "مركز بيع أدوات تسلق جبال 🏔️", "مركز بيع أدوات غوص 🤿", "مركز بيع أدوات ملاحة 🧭", "مركز بيع أدوات طيران ✈️", "مركز بيع أدوات فضاء 🛰️", "مركز بيع أدوات فلكية 🔭"
]



ITEMS = [     "كسكس 🍲", "شخشوخة 🥣", "محاجب 🥞", "رفيس 🍵", "حريرة 🍲", "طاجين 🍖", "ملوخية 🍲", "رشتة 🍜", 
    "لحم حلو 🍖", "دقلة نور 🍌", "زلابية 🍩", "قلب اللوز 🍪", "بغرير 🥞", "سفنج 🍩", "بسبوسة 🍰", 
    "مثوم 🍞", "شربة فريك 🥣", "كعك النقّاش 🍪", "مقرونة 🍝", "عصيدة 🥣", "كليلة 🍲", "فطير 🥐", 
    "خبز الدار 🍞", "خبز المطلوع 🍞", "خبز الفرن 🍞", "كسرة 🥖", "شطيطحة 🥘", "بوقورون 🍽️", 
    "براكوكش 🍲", "كرعين 🍗", "بوزلوف 🍢", "دجاج محمر 🍗", "مشوي 🍖", "كفتة 🍡", "لبنة 🧀", 
    "جبن قريش 🧀", "لبن 🥛", "رايب 🥛", "سمن 🌼", "زيت زيتون 🫒", "زبدة بلدية 🧈", "زيتون أسود 🫒", 
    "زيتون أخضر 🫒", "صلصة مشوية 🌶️", "حمص 🥣", "عدس 🍲", "لوبيا 🌱", "شعير 🌾", "تمور 🌴", 
    "كاوكاو 🥜", "لوز 🌰", "جوز 🌰", "قرفة 🥧", "فلفل أحمر 🌶️", "كمون 🌿", "رند 🌿", "عكري 🍯", 
    "قرنون 🎋", "هميس 🌿", "فريكاسي 🍲", "بريك 🥟", "سفة 🍜", "مروزية 🍖", "مدردرة 🍲", 
    "قاطو اللوز 🍰", "مملحات 🥨", "معجنات 🥐", "طبسيل 🍽️", "سكرية 🍬", "مغرف 🥄", "طبسي 🍲", 
    "قصرية 🥘", "قصعة 🍲", "فخار 🏺", "نحاس ⚙️", "طبل 🥁", "بندير 🥁", "دربوكة 🥁", "ناي 🎶", 
    "قانون 🎶", "رباب 🎻", "مزمار 🎶", "زكرة 🎶", "خمري 🍷", "قندورة 👕", "قشابية 👘", 
    "برنوس 🧥", "فوطا 🛁", "بلوزة 👚", "جبادور 👗", "سروال مدور 👖", "سروال قندريسي 👖", 
    "شاش 🧣", "عمامة 🧕", "شربيل 👡", "سباط بلاستيك 👟", "سكاتش 👟", "شبشب 🥿", "كرافات 👔", 
    "طربوش 🎩", "حرير 🧵", "صوف 🧶", "قطن ☁️", "كتان 🧵", "مقص ✂️", "إبرة 🪡", "مغزل 🧶", 
    "خيط 🧵"., "تطريز 🎨", "كروشي 🧶", "خياطة 👗", "زربية 🪞", "بساط 🧺", "سجاد 🧼", 
    "وسادة 🛏️", "غطاء 🛌", "كوفيرطة 🛏️", "لحاف 🛏️", "جلابة 🧥", "حزام حرير 🧣", "حزام شدة 💎", 
    "حرز 🧿", "خميسة ✋", "فضة 🪙", "ذهب 🥇", "خلخال 💍", "سوار 📿", "عقد 💎", "حلق 🧏", 
    "شدة تلمسانية 👘", "شدة قسنطينية 👗", "شدة قبائلية 👘", "خمرة (إبريق) 🍶", "كحل 🧴", 
    "قعدة 🛏️", "طاسة 🥣", "قهوة ☕", "دلّة 🫖", "براد 🫖", "كأس شاي 🍵", "نعناع 🌿", 
    "شاي أحمر 🍵", "قهوة محمصة ☕", "ڨازوز 🥤", "بوقطايف 🍰", "مڨروط 🍪", "نوڨا 🍬", 
    "كاراميل 🍭", "شوكولا 🍫", "علكة 🍬", "طمينة 🍚", "لبان 🌿", "خل 🧴", "قمح 🌾", 
    "ذرة 🌽", "زريعة 🌻", "فول سوداني 🥜", "جلبانة 🥬", "عسل 🍯", "برقوق 🍑", "كرز 🍒", 
    "خوخ 🍑", "تين مجفف 🌰", "شمام 🍈", "رمان 🍎", "دلاح 🍉", "قرعة 🎃", "صبار 🌵", 
    "لب بلدي 🥜", "مربى 🍓", "عصير 🍹", "براد ماء 🚰", "سطل 🪣", "قفة 🧺", "غربال 🪶", 
    "طاجين فخار 🍲", "كسكاس 🍲", "قدر الضغط 🍳", "مقلاة 🍳", "كيس 🛍️", "لوح تقطيع 🔪", 
    "مصفاة 🧂", "مغرف كبير 🥄", "محراك 🔁", "عجانة 🍞", "فرن بلدي 🔥", "طابونة 🧱", 
    "مبخرة 🪔", "فحم 🧱", "فانوس 🏮", "شمعة 🕯️", "زمارة 📯", "بخاخ ماء ورد 🌹", 
    "صابون بلدي 🧼", "صابون غسيل 🧽", "شامبو 🧴", "زيت أركان 🌰", "زيت اللوز 🥥", 
    "زيت السمسم 🌿", "فازلين 🧴", "مراية 🪞", "مشط خشب 💇", "مكنسة 🧹", "شماعة 🧥", 
    "ستارة 🪟", "لحاف صوف 🛌", "كوفيرطة قطن 🛏️", "طقم غسيل 🧺", "مناديل ورقية 🧻", 
    "قماش تقليدي 👘", "قطعة حرير 🧵", "منديل عطري 🌺", "مسبحة 📿", "قرآن 📖", 
    "حامل مصحف 🧎", "مسبح سبسي 🚬", "معطر جو 🌬️", "فواحة كهربائية 💨", "سجادة صلاة 🕌", 
    "حافظة طعام 🍱", "علبة تمر 🌴", "علبة حلويات 🍬", "مجسم جمل 🐫", "مجسم طائرة ✈️", 
    "طابع بريدي 🖋️", "دفتر هوية 📓", "أوراق نقدية 💵", "دنانير 💰", "قندورة عرس 👰", 
    "طرحة قبائلية 🧣", "طرحة قسنطينية 🧕", "طرحة تلمسانية 👑", "بشكير 🧺", "منشفة حمام 🛁", 
    "فوطة مطرزة 🧻", "صينية تقديم 🍽️", "حافظات ماء 💧", "جرة فخار 🏺", "إناء خشب 🪵", 
    "مروحة يدوية 🌬️", "عطر عربي 🌸", "عطر فرنسي 🌺", "علبة طيب 🌼", "سبسي تقليدي 🚬", 
    "مسباح أمازيغي 📿", "خنجر تقليدي ⚔️", "سيف زينة 🗡️", "رمح تقليدي 🏹", "ناي أمازيغي 🎼", 
    "قلال تقليدي 🥁", "دف صوفي 🪘", "لوحة فسيفساء 🎨", "خيمة صحراوية ⛺", "قفطان تقليدي 👗", 
    "بلوزة وهرانية 👚", "شاش شاوي 🧣", "جلابة صحراوية 🧥", "سروال عربي 👖", "تاقيا ⛑️", 
    "سلهام 🧥", "برنوس أبيض 👘", "خيمة أمازيغية ⛺", "خاتم فضة 💍", "حلية أمازيغية 🪙", 
    "إسوارة مطرزة 🧵", "قلادة زينة 💎", "شنطة جلدية 👜", "محفظة نقود 👛", "نظارات تقليدية 🕶️", 
    "مزهرية فخار 🌺", "مبخرة تقليدية 🪔", "علبة ذهبية 📦", "دمية قماش 🧸", "بوق تقليدي 📯", 
    "طبلة قسنطينية 🪘", "مزمار شعبي 🎶", "عود موسيقي 🎸", "غيتار شعبي 🎵", "دف نوبة 🥁", 
    "قبقاب خشب 🥿", "زربية قبائلية 🧶", "زربية الهقار 🪺", "زربية بسكرة 🧺", "سجاد قسنطينة 🧻", 
    "تمثال حجري 🗿", "تمثال صخري 🪨", "سبحة خشب 🌰", "سبحة كهرمان 💠", "مجمرة بخور 🔥", 
    "نقالة تقليدية 🛏️", "قنينة ماء 🍼", "دلو غسيل 🪣", "زجاجة زيت 🫙", "جردل بلاستيك 🚿", 
    "مكواة فحم 🔥", "خزانة خشب 🗄️", "مرآة حائط 🪞", "مشجب ملابس 🪢", "سلة مهملات 🧺", 
    "فرشاة شعر 💇", "فرشاة تنظيف 🧽", "سطل حديد 🪣", "مصباح غاز 🔥", "شمع بلدي 🕯️", 
    "خيوط صوف 🧶", "مئزر تقليدي 🧵", "غطاء رأس نسوي 🧕", "سباط تقليدي 👞", "شنطة يد 👜", 
    "محفظة أوراق 💼", "رزمة نقود 💴", "خاتم عقيق 🟥", "لؤلؤ طبيعي 🦪", "حناء 🌿", 
    "صبغة طبيعية 🎨", "كحل الإثمد 🧴", "علبة مكياج 💄", "ثوب عرس تقليدي 👰", "كرافات عرس 👔", 
    "قميص شدة 👕", "شدة عاصمية 💠", "صندوق عروس 🎁", "حزام جلدي 🧷", "مرش ماء ورد 🌸", 
    "قرط ذهب 💎", "خاتم مزخرف 🧿", "بروش تقليدي 🎀", "طاقية شتوية 🧢", "قفازات جلد 🧤", 
    "حذاء عرس 👠", "زرابي مطرزة 🪟", "مساند زينة 🛋️", "طبل صحراوي 🥁", "كيس هدايا 🎁", 
    "قفة خوص 🧺", "مكنسة تقليدية 🧹", "دلو من الفخار 🪣", "مجسم قبة الشهداء 🏛️", 
    "علم الجزائر 🇩🇿", "جواز سفر جزائري 📘", "بطاقة تعريف وطنية 🪪", "عملة جزائرية 💰", 
    "قرش نحاسي 🪙", "تمثال الأمير عبد القادر 🗿", "صورة المجاهدين 📷", "بندقية قديمة 🔫", 
    "ذخيرة تقليدية 🧨", "تمثال الشيخ بوعمامة 🧔", "منحوتة الطاسيلي 🪨", "نقوش ما قبل التاريخ 🗿", 
    "طابع بريد جزائري ✉️", "قطعة نقدية 🪙", "قلادة تراثية 🧷", "إبرة خياطة 🪡", 
    "صابون الغار 🧼", "زيت الضرو 🪵", "طين تجميلي 🪨"
]

# أسعار المتجر
SHOP_ITEMS = {
    "تبون": 100000000,
    "شنڤريحة": 200000000,
    "شاب بيلو": 300000000,
    "ديدين كلاش": 400000000,
    "ايناس عبدلي": 500000000,
    "ريفكا": 600000000,
    "كريم": 700000000,
    "عادل ميكسيك": 800000000,
    "مراد طهاري": 1500000000
}

BANKS = ["بدر", "الهلال", "أويحي"]

# دالة لحفظ البيانات
def save_data():
    with open('user_data.json', 'w', encoding='utf-8') as f:
        json.dump({
            'user_accounts': user_accounts,
            'banned_users': list(banned_users),
            'user_inventory': user_inventory
        }, f, ensure_ascii=False, indent=2)

# دالة لتحميل البيانات
def load_data():
    global user_accounts, banned_users, user_inventory
    try:
        with open('user_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            user_accounts = data.get('user_accounts', {})
            banned_users = set(data.get('banned_users', []))
            user_inventory = data.get('user_inventory', {})
    except FileNotFoundError:
        user_accounts = {}
        banned_users = set()
        user_inventory = {}

# تحميل البيانات عند بدء التشغيل
load_data()

# إعداد الأوامر
bot.set_my_commands([
    BotCommand("start", "بدء التشغيل"),
    BotCommand("newgame", "بدء لعبة جديدة"),
    BotCommand("shop", "المتجر"),
    BotCommand("account", "حسابي"),
    BotCommand("inventory", "ممتلكاتي"),
    BotCommand("transfer", "تحويل أموال"),
    BotCommand("ban", "حظر مستخدم (للمطور فقط)"),
    BotCommand("unban", "إلغاء حظر مستخدم (للمطور فقط)")
])

# دالة التحقق من الحظر
def is_banned(user_id):
    return str(user_id) in banned_users

# دالة التحقق من أن البوت أدمن
def is_bot_admin(chat_id):
    try:
        bot_member = bot.get_chat_member(chat_id, bot.get_me().id)
        return bot_member.status in ['administrator', 'creator']
    except:
        return False

# دالة إنشاء حساب مستخدم
def create_user_account(user_id):
    if str(user_id) not in user_accounts:
        user_accounts[str(user_id)] = {
            'balance': 0,
            'account_number': None,
            'bank': None
        }
        user_inventory[str(user_id)] = {}
        save_data()

# دالة الحصول على رصيد المستخدم
def get_user_balance(user_id):
    create_user_account(user_id)
    return user_accounts[str(user_id)]['balance']

# دالة إضافة المال للمستخدم
def add_money(user_id, amount):
    create_user_account(user_id)
    user_accounts[str(user_id)]['balance'] += amount
    save_data()

# دالة خصم المال من المستخدم
def deduct_money(user_id, amount):
    create_user_account(user_id)
    if user_accounts[str(user_id)]['balance'] >= amount:
        user_accounts[str(user_id)]['balance'] -= amount
        save_data()
        return True
    return False

# معالج الأمر /start
@bot.message_handler(commands=['start'])
def start_command(message):
    if is_banned(message.from_user.id):
        bot.reply_to(message, "❌ أنت محظور من استخدام البوت. اتصل بالمطور @V_b_L_o للإفراج عنك.")
        return
    
    if message.chat.type == 'private':
        # إنشاء حساب المستخدم
        create_user_account(message.from_user.id)
        
        # إرسال الصورة والنص
        photo_url = "https://pin.it/2qzWrzyQO"
        caption = """🕵️‍♂️ لعبة Spyfall هي لعبة اجتماعية قصيرة (3–30 لاعبين)
يجتهد فيها "الجاسوس" في تخمين مكان سري،
بينما يحاول الآخرون كشفه بأسئلة ذكية،
أو ينتصر الجاسوس إذا ظل خفيًا أو خمن المكان.
🔗 رابط المجموعة: https://t.me/+0ipdbPwuF304OWRk
👨‍💻 المطور: @V_b_L_o"""
        
        keyboard = InlineKeyboardMarkup()
        keyboard.add(InlineKeyboardButton("🔘 اضغط هنا باه تفهم", callback_data="rules"))
        keyboard.add(InlineKeyboardButton("🎮 اضفني لمجموعتك لبدأ اللعبة", url="http://t.me/spy_spy_bbot?startgroup=new"))
        
        try:
            bot.send_photo(message.chat.id, photo_url, caption=caption, reply_markup=keyboard)
        except:
            bot.send_message(message.chat.id, caption, reply_markup=keyboard)
    else:
        # في المجموعة
        if not is_bot_admin(message.chat.id):
            bot.send_message(message.chat.id, "❌ لا استطيع إكمال اللعبة إلا عند رفعي أدمن")
            return
        
        bot.send_message(message.chat.id, "👋 شكرًا لإضافتي!\nاضغط على /newgame للبدء.")

# معالج الضغط على الأزرار
@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if is_banned(call.from_user.id):
        bot.answer_callback_query(call.id, "❌ أنت محظور من استخدام البوت.")
        return
    
    if call.data == "rules":
        rules_text = """📜 **قواعد اللعبة:**
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
– فريق جواسيس مش عارفينه"""
        
        bot.send_message(call.message.chat.id, rules_text, parse_mode='Markdown')
    
    elif call.data == "start_game":
        chat_id = call.message.chat.id
        if chat_id not in game_sessions:
            game_sessions[chat_id] = {
                'status': 'waiting',
                'players': [],
                'start_time': time.time(),
                'join_deadline': time.time() + 90  # دقيقة ونصف
            }
        
        keyboard = InlineKeyboardMarkup()
        keyboard.add(InlineKeyboardButton("🟢 انضم للعبة", callback_data="join_game"))
        keyboard.add(InlineKeyboardButton("🟠 كيفاه تتعلب هذي اللعبة", callback_data="rules"))
        keyboard.add(InlineKeyboardButton("🟣 انضم للقناة للمزيد من المتعة", url="https://t.me/+0ipdbPwuF304OWRk"))
        
        bot.edit_message_reply_markup(chat_id, call.message.message_id, reply_markup=keyboard)
    
    elif call.data == "join_game":
        chat_id = call.message.chat.id
        user_id = call.from_user.id
        
        if chat_id not in game_sessions:
            bot.answer_callback_query(call.id, "❌ لا توجد لعبة نشطة")
            return
        
        if time.time() > game_sessions[chat_id]['join_deadline']:
            bot.answer_callback_query(call.id, "❌ انتهت مدة الانضمام")
            return
        
        if user_id not in [p['id'] for p in game_sessions[chat_id]['players']]:
            game_sessions[chat_id]['players'].append({
                'id': user_id,
                'name': call.from_user.first_name,
                'username': call.from_user.username
            })
            
            # تحديث قائمة اللاعبين
            players_list = ""
            for i, player in enumerate(game_sessions[chat_id]['players'], 1):
                players_list += f"{i}. {player['name']}\n"
            
            remaining_time = int(game_sessions[chat_id]['join_deadline'] - time.time())
            
            new_text = f"🎮 **اللاعبون المنضمون:**\n{players_list}\n⏳ الوقت المتبقي: {remaining_time} ثانية"
            
            try:
                bot.edit_message_text(new_text, chat_id, call.message.message_id, parse_mode='Markdown')
            except:
                pass
            
            bot.answer_callback_query(call.id, f"✅ تم انضمامك للعبة! ({len(game_sessions[chat_id]['players'])} لاعبين)")
            
            # بدء مؤقت للانتهاء من مرحلة الانضمام
            if len(game_sessions[chat_id]['players']) == 1:
                threading.Timer(90, end_join_phase, [chat_id]).start()
        else:
            bot.answer_callback_query(call.id, "❌ أنت منضم بالفعل")
    
    elif call.data in ["things", "places"]:
        chat_id = call.message.chat.id
        if chat_id in game_sessions:
            game_sessions[chat_id]['game_type'] = call.data
            bot.edit_message_text("📝 كم عدد الأشخاص العاديين؟", chat_id, call.message.message_id)
            game_sessions[chat_id]['status'] = 'setting_players'
    
    elif call.data.startswith("vote_"):
        handle_vote(call)
    
    elif call.data.startswith("bank_"):
        handle_bank_selection(call)
    
    elif call.data.startswith("buy_"):
        handle_purchase(call)
    
    elif call.data.startswith("sell_"):
        handle_sell(call)

# دالة انتهاء مرحلة الانضمام
def end_join_phase(chat_id):
    if chat_id in game_sessions and game_sessions[chat_id]['status'] == 'waiting':
        if len(game_sessions[chat_id]['players']) < 3:
            bot.send_message(chat_id, "❌ عدد اللاعبين غير كافي. يجب أن يكون 3 لاعبين على الأقل.")
            del game_sessions[chat_id]
            return
        
        keyboard = InlineKeyboardMarkup()
        keyboard.add(InlineKeyboardButton("📦 اشياء", callback_data="things"))
        keyboard.add(InlineKeyboardButton("📍 اماكن", callback_data="places"))
        
        bot.send_message(chat_id, "واش حابين؟", reply_markup=keyboard)

# معالج الأمر /newgame
@bot.message_handler(commands=['newgame'])
def newgame_command(message):
    if is_banned(message.from_user.id):
        bot.reply_to(message, "❌ أنت محظور من استخدام البوت.")
        return
    
    if message.chat.type == 'private':
        bot.reply_to(message, "❌ هذا الأمر يعمل فقط في المجموعات")
        return
    
    if not is_bot_admin(message.chat.id):
        bot.reply_to(message, "❌ لا استطيع إكمال اللعبة إلا عند رفعي أدمن")
        return
    
    chat_id = message.chat.id
    
    if chat_id in game_sessions:
        bot.reply_to(message, "❌ لا يمكن بداية لعبة جديدة حتى تكمل البارتية")
        return
    
    keyboard = InlineKeyboardMarkup()
    keyboard.add(InlineKeyboardButton("🔵 أبدا اللعبة", callback_data="start_game"))
    keyboard.add(InlineKeyboardButton("🟠 كيفاه تتعلب هذي اللعبة", callback_data="rules"))
    keyboard.add(InlineKeyboardButton("🟣 انضم للقناة للمزيد من المتعة", url="https://t.me/+0ipdbPwuF304OWRk"))
    
    bot.reply_to(message, "🤔 حاب تبدا تلعب؟", reply_markup=keyboard)

# معالج الرسائل العادية
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    if is_banned(message.from_user.id):
        return
    
    chat_id = message.chat.id
    user_id = message.from_user.id
    
    # التحقق من إعدادات اللعبة
    if chat_id in game_sessions:
        session = game_sessions[chat_id]
        
        if session['status'] == 'setting_players':
            try:
                player_count = int(message.text)
                if 3 <= player_count <= 30:
                    session['normal_players'] = player_count
                    session['status'] = 'setting_spies'
                    bot.delete_message(chat_id, message.message_id)
                    bot.send_message(chat_id, "📝 كم عدد الجواسيس؟")
                else:
                    bot.reply_to(message, "❌ عدد اللاعبين يجب أن يكون بين 3 و 30")
            except ValueError:
                bot.reply_to(message, "❌ يرجى إدخال رقم صحيح")
        
        elif session['status'] == 'setting_spies':
            try:
                spy_count = int(message.text)
                total_players = len(session['players'])
                max_spies = total_players // 3
                
                if spy_count < 1 or spy_count > 10:
                    bot.reply_to(message, "❌ عدد الجواسيس يجب أن يكون بين 1 و 10")
                elif spy_count > max_spies:
                    if total_players <= 5:
                        bot.reply_to(message, "❌ لا يمكن ذلك، يمكنك اختيار فقط جاسوس واحد")
                    else:
                        bot.reply_to(message, f"❌ لا يمكن اختيار أكثر من {max_spies} جواسيس")
                else:
                    session['spy_count'] = spy_count
                    session['status'] = 'setting_time'
                    bot.delete_message(chat_id, message.message_id)
                    bot.send_message(chat_id, "📝 كم دقيقة تريدون هذه البارتية؟")
            except ValueError:
                bot.reply_to(message, "❌ يرجى إدخال رقم صحيح")
        
        elif session['status'] == 'setting_time':
            try:
                game_time = int(message.text)
                if 1 <= game_time <= 15:
                    session['game_time'] = game_time
                    bot.delete_message(chat_id, message.message_id)
                    start_game_distribution(chat_id)
                else:
                    bot.reply_to(message, "❌ وقت اللعبة يجب أن يكون بين 1 و 15 دقيقة")
            except ValueError:
                bot.reply_to(message, "❌ يرجى إدخال رقم صحيح")
    
    # التحقق من الأوامر الأخرى
    if message.text == "start" and message.chat.type == 'private':
        if chat_id in [session['chat_id'] for session in game_sessions.values() if 'chat_id' in session]:
            send_role_to_user(user_id)
    
    elif message.text == "ممتلكاتي":
        show_inventory(message)
    
    elif message.text.startswith("فارسي "):
        handle_transfer_request(message)
    
    elif message.text.startswith("شراء "):
        handle_buy_command(message)
    
    elif message.text.startswith("بيع "):
        handle_sell_command(message)
    
    elif message.text == "حلي بونكا":
        show_banks(message)

# دالة بدء توزيع الأدوار
def start_game_distribution(chat_id):
    session = game_sessions[chat_id]
    session['status'] = 'distributing'
    
    # اختيار الموقع/الشيء
    if session['game_type'] == 'places':
        session['target'] = random.choice(PLACES)
    else:
        session['target'] = random.choice(THINGS)
    
    # اختيار الجواسيس
    players = session['players'].copy()
    random.shuffle(players)
    session['spies'] = players[:session['spy_count']]
    session['normal_players'] = players[session['spy_count']:]
    
    # إرسال رسالة في المجموعة
    bot.send_message(chat_id, "ارسل لي كلمة start في الخاص لترى دورك")
    
    # بدء اللعبة بعد 30 ثانية
    threading.Timer(30, start_actual_game, [chat_id]).start()

# دالة إرسال الدور للمستخدم
def send_role_to_user(user_id):
    for chat_id, session in game_sessions.items():
        if session.get('status') == 'distributing':
            # البحث عن اللاعب
            is_spy = any(p['id'] == user_id for p in session['spies'])
            is_normal = any(p['id'] == user_id for p in session['normal_players'])
            
            if is_spy:
                spy_photo = "https://pin.it/2Xv5gZUHU"
                message = "🕵️‍♂️ أنت هو الجاسوس\nاعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!"
                try:
                    bot.send_photo(user_id, spy_photo, caption=message)
                except:
                    bot.send_message(user_id, message)
            elif is_normal:
                game_type = "الموقع" if session['game_type'] == 'places' else "الشيء"
                message = f"🚫🕵️ أنت ماكش جاسوس\n{game_type}: {session['target']}"
                bot.send_message(user_id, message)
            break

# دالة بدء اللعبة الفعلية
def start_actual_game(chat_id):
    if chat_id in game_sessions:
        session = game_sessions[chat_id]
        session['status'] = 'playing'
        session['game_start_time'] = time.time()
        session['game_end_time'] = time.time() + (session['game_time'] * 60)
        
        bot.send_message(chat_id, "📢 صَيَّبو مدينا الأدوار، ابداو تلعبو! 🎲🕰️")
        
        # تشغيل مؤقت التصويت
        vote_timer = (session['game_time'] * 60) - 40
        threading.Timer(vote_timer, start_voting, [chat_id]).start()
        
        # تشغيل مؤقت انتهاء اللعبة
        threading.Timer(session['game_time'] * 60, end_game, [chat_id, 'time_up']).start()

# دالة بدء التصويت
def start_voting(chat_id):
    if chat_id in game_sessions and game_sessions[chat_id]['status'] == 'playing':
        session = game_sessions[chat_id]
        session['status'] = 'voting'
        session['votes'] = {}
        
        bot.send_message(chat_id, "⏰ أرسلت لكم التصويت في الخاص")
        
        # إرسال التصويت لكل لاعب
        for player in session['players']:
            send_vote_to_player(chat_id, player['id'])

# دالة إرسال التصويت للاعب
def send_vote_to_player(chat_id, user_id):
    session = game_sessions[chat_id]
    keyboard = InlineKeyboardMarkup()
    
    for player in session['players']:
        if player['id'] != user_id:  # لا يمكن التصويت لنفسه
            keyboard.add(InlineKeyboardButton(
                player['name'], 
                callback_data=f"vote_{chat_id}_{player['id']}"
            ))
    
    bot.send_message(user_id, "على من تصوت أنه الجاسوس؟", reply_markup=keyboard)

# دالة معالجة التصويت
def handle_vote(call):
    data = call.data.split('_')
    chat_id = int(data[1])
    voted_user_id = int(data[2])
    voter_id = call.from_user.id
    
    if chat_id not in game_sessions:
        bot.answer_callback_query(call.id, "❌ اللعبة غير موجودة")
        return
    
    session = game_sessions[chat_id]
    
    if voter_id in session['votes']:
        bot.answer_callback_query(call.id, "❌ لقد صوت بالفعل")
        return
    
    session['votes'][voter_id] = voted_user_id
    
    # العثور على اسم المصوت عليه
    voted_name = next((p['name'] for p in session['players'] if p['id'] == voted_user_id), "مجهول")
    voter_name = call.from_user.first_name
    
    bot.send_message(chat_id, f"🗳️ {voter_name} صوت لإعدام {voted_name}")
    bot.answer_callback_query(call.id, "✅ تم تسجيل صوتك")
    
    # التحقق من اكتمال التصويت
    if len(session['votes']) == len(session['players']):
        process_votes(chat_id)

# دالة معالجة نتائج التصويت
def process_votes(chat_id):
    session = game_sessions[chat_id]
    
    # حساب الأصوات
    vote_counts = {}
    for voted_user_id in session['votes'].values():
        vote_counts[voted_user_id] = vote_counts.get(voted_user_id, 0) + 1
    
    # العثور على اللاعب الأكثر تصويتاً
    most_voted_id = max(vote_counts, key=vote_counts.get)
    most_votes = vote_counts[most_voted_id]
    
    # التحقق من كونه جاسوس
    is_spy = any(p['id'] == most_voted_id for p in session['spies'])
    
    if is_spy:
        # فوز اللاعبين
        end_game(chat_id, 'players_win')
    else:
        # فوز الجواسيس
        end_game(chat_id, 'spies_win')

# دالة انتهاء اللعبة
def end_game(chat_id, result):
    if chat_id not in game_sessions:
        return
    
    session = game_sessions[chat_id]
    
    if result == 'spies_win':
        bot.send_message(chat_id, "🎉 فاز الجاسوس!")
        
        # إرسال فيديو فوز الجاسوس
        spy_video = "https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/spy_win.mp4"
        try:
            bot.send_video(chat_id, spy_video)
        except:
            pass
        
        # إضافة المال للجواسيس
        for spy in session['spies']:
            add_money(spy['id'], 2000000000)
        
        bot.send_message(chat_id, 
            "💰 حصل الجاسوس على جائزة مالية 2,000,000,000 د.ج\n"
            "عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، "
            "ارسلوا أسمائهم لـ @V_b_L_o ليخرجهم من اللعبة نهائيًا.")
    
    elif result == 'players_win':
        bot.send_message(chat_id, "🎊 فاز اللاعبون!")
        
        # إرسال فيديو فوز اللاعبين
        players_video = "https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/players_win.mp4"
        try:
            bot.send_video(chat_id, players_video)
        except:
            pass
        
        # إضافة المال للاعبين العاديين
        for player in session['normal_players']:
            add_money(player['id'], 100000)
        
        bot.send_message(chat_id, 
            "💸 كل لاعب حصل على 100,000 د.ج\n"
            "عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، "
            "ارسلوا اسمه لـ @V_b_L_o ليُقصى نهائيًا.")
    
    elif result == 'time_up':
        bot.send_message(chat_id, "🕒 انتهى الوقت! فاز الجواسيس!")
        
        # إضافة المال للجواسيس
        for spy in session['spies']:
            add_money(spy['id'], 2000000000)
    
    # عرض النتائج النهائية
    show_final_results(chat_id)
    
    # حذف الجلسة
    del game_sessions[chat_id]

# دالة عرض النتائج النهائية
def show_final_results(chat_id):
    session = game_sessions[chat_id]
    
    game_type = "الموقع" if session['game_type'] == 'places' else "الشيء"
    results_text = f"🎯 {game_type}: {session['target']}\n\n"
    results_text += "👥 **قائمة اللاعبين:**\n"
    
    for player in session['players']:
        is_spy = any(p['id'] == player['id'] for p in session['spies'])
        role = "🕵️‍♂️ جاسوس" if is_spy else "👤 لاعب عادي"
        results_text += f"• {player['name']}: {role}\n"
    
    bot.send_message(chat_id, results_text, parse_mode='Markdown')

# معالج أمر المتجر
@bot.message_handler(commands=['shop'])
def shop_command(message):
    if is_banned(message.from_user.id):
        return
    
    create_user_account(message.from_user.id)
    balance = get_user_balance(message.from_user.id)
    
    shop_text = f"🛒 **متجر البوت**\n💰 رصيدك: {balance:,} د.ج\n\n"
    
    keyboard = InlineKeyboardMarkup()
    for item, price in SHOP_ITEMS.items():
        shop_text += f"• {item}: {price:,} د.ج\n"
        keyboard.add(InlineKeyboardButton(f"شراء {item}", callback_data=f"buy_{item}"))
    
    bot.send_message(message.chat.id, shop_text, parse_mode='Markdown', reply_markup=keyboard)

# معالج أمر الحساب
@bot.message_handler(commands=['account'])
def account_command(message):
    if is_banned(message.from_user.id):
        return
    
    create_user_account(message.from_user.id)
    user_data = user_accounts[str(message.from_user.id)]
    
    account_text = f"🏦 **حسابك البنكي**\n"
    account_text += f"💰 الرصيد: {user_data['balance']:,} د.ج\n"
    
    if user_data['account_number']:
        account_text += f"🏛️ البنك: {user_data['bank']}\n"
        account_text += f"📄 رقم الحساب: {user_data['account_number']}\n"
    else:
        account_text += "❌ لم يتم فتح حساب بنكي بعد\n"
        account_text += "استخدم الأمر 'حلي بونكا' لفتح حساب"
    
    bot.send_message(message.chat.id, account_text, parse_mode='Markdown')

# معالج أمر الممتلكات
@bot.message_handler(commands=['inventory'])
def inventory_command(message):
    show_inventory(message)

def show_inventory(message):
    if is_banned(message.from_user.id):
        return
    
    user_id = str(message.from_user.id)
    create_user_account(message.from_user.id)
    
    if user_id not in user_inventory or not user_inventory[user_id]:
        bot.send_message(message.chat.id, "📦 ممتلكاتك فارغة")
        return
    
    inventory_text = "✨ **ممتلكاتي:**\n\n"
    keyboard = InlineKeyboardMarkup()
    
    for item, quantity in user_inventory[user_id].items():
        inventory_text += f"• {item}: {quantity}\n"
        keyboard.add(InlineKeyboardButton(f"بيع {item}", callback_data=f"sell_{item}"))
    
    bot.send_message(message.chat.id, inventory_text, parse_mode='Markdown', reply_markup=keyboard)

# دالة معالجة الشراء
def handle_purchase(call):
    user_id = str(call.from_user.id)
    item = call.data.split('_', 1)[1]
    price = SHOP_ITEMS[item]
    
    if deduct_money(int(user_id), price):
        # إضافة العنصر للمخزون
        if user_id not in user_inventory:
            user_inventory[user_id] = {}
        user_inventory[user_id][item] = user_inventory[user_id].get(item, 0) + 1
        save_data()
        
        remaining_balance = get_user_balance(int(user_id))
        bot.answer_callback_query(call.id, f"✅ تم شراء {item}")
        bot.send_message(call.message.chat.id, 
            f"💵 لقد اشتريت 1 {item} بسعر {price:,} د.ج\n"
            f"💰 تبقى لديك {remaining_balance:,} د.ج")
    else:
        bot.answer_callback_query(call.id, "❌ رصيد غير كافي")

# دالة معالجة البيع
def handle_sell(call):
    user_id = str(call.from_user.id)
    item = call.data.split('_', 1)[1]
    
    if user_id in user_inventory and item in user_inventory[user_id] and user_inventory[user_id][item] > 0:
        # حساب سعر البيع (75% من السعر الأصلي)
        original_price = SHOP_ITEMS[item]
        sell_price = int(original_price * 0.75)
        
        # إضافة المال وإزالة العنصر
        add_money(int(user_id), sell_price)
        user_inventory[user_id][item] -= 1
        
        if user_inventory[user_id][item] == 0:
            del user_inventory[user_id][item]
        
        save_data()
        
        balance = get_user_balance(int(user_id))
        bot.answer_callback_query(call.id, f"✅ تم بيع {item}")
        bot.send_message(call.message.chat.id, 
            f"💰 استرجعت 75% من المبلغ: {sell_price:,} د.ج\n"
            f"💵 رصيدك الحالي: {balance:,} د.ج")
    else:
        bot.answer_callback_query(call.id, "❌ لا تملك هذا العنصر")

# دالة عرض البنوك
def show_banks(message):
    if is_banned(message.from_user.id):
        return
    
    keyboard = InlineKeyboardMarkup()
    for bank in BANKS:
        keyboard.add(InlineKeyboardButton(bank, callback_data=f"bank_{bank}"))
    
    bot.send_message(message.chat.id, "🏦 اختر البنك:", reply_markup=keyboard)

# دالة معالجة اختيار البنك
def handle_bank_selection(call):
    user_id = str(call.from_user.id)
    bank = call.data.split('_')[1]
    
    create_user_account(int(user_id))
    
    # إنشاء رقم حساب عشوائي
    account_number = f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    user_accounts[user_id]['bank'] = bank
    user_accounts[user_id]['account_number'] = account_number
    save_data()
    
    bot.answer_callback_query(call.id, "✅ تم فتح الحساب")
    bot.send_message(call.message.chat.id, 
        f"🏦 تم فتح الحساب في بنك {bank}\n"
        f"💰 رصيدك: 0 د.ج\n"
        f"📄 رقم الحساب: {account_number}")

# دالة معالجة التحويل
def handle_transfer_request(message):
    if is_banned(message.from_user.id):
        return
    
    try:
        amount = int(message.text.split()[1])
        user_id = str(message.from_user.id)
        
        create_user_account(message.from_user.id)
        
        if not user_accounts[user_id]['account_number']:
            bot.reply_to(message, "❌ يجب فتح حساب بنكي أولاً")
            return
        
        if amount <= 0:
            bot.reply_to(message, "❌ المبلغ يجب أن يكون أكبر من صفر")
            return
        
        # حساب العمولة (15%)
        commission = int(amount * 0.15)
        total_amount = amount + commission
        
        if get_user_balance(message.from_user.id) < total_amount:
            bot.reply_to(message, "❌ رصيد غير كافي")
            return
        
        bot.reply_to(message, 
            f"💸 أرسل رقم حساب المستفيد لتحويل {amount:,} د.ج\n"
            f"💰 العمولة: {commission:,} د.ج\n"
            f"🧮 المبلغ الإجمالي: {total_amount:,} د.ج")
        
        # هنا يمكن إضافة منطق إضافي للتحويل
        
    except (ValueError, IndexError):
        bot.reply_to(message, "❌ استخدم الصيغة: فارسي [المبلغ]")

# دالة معالجة أمر الشراء
def handle_buy_command(message):
    if is_banned(message.from_user.id):
        return
    
    try:
        parts = message.text.split(None, 2)
        if len(parts) < 3:
            bot.reply_to(message, "❌ استخدم الصيغة: شراء [العدد] [اسم السلعة]")
            return
        
        quantity = int(parts[1])
        item = parts[2]
        
        if item not in SHOP_ITEMS:
            bot.reply_to(message, "❌ هذه السلعة غير متوفرة في المتجر")
            return
        
        if quantity <= 0:
            bot.reply_to(message, "❌ الكمية يجب أن تكون أكبر من صفر")
            return
        
        total_price = SHOP_ITEMS[item] * quantity
        user_id = str(message.from_user.id)
        
        if deduct_money(message.from_user.id, total_price):
            if user_id not in user_inventory:
                user_inventory[user_id] = {}
            user_inventory[user_id][item] = user_inventory[user_id].get(item, 0) + quantity
            save_data()
            
            remaining_balance = get_user_balance(message.from_user.id)
            bot.reply_to(message, 
                f"✅ تم شراء {quantity} {item} بسعر {total_price:,} د.ج\n"
                f"💰 تبقى لديك {remaining_balance:,} د.ج")
        else:
            bot.reply_to(message, "❌ رصيد غير كافي")
            
    except ValueError:
        bot.reply_to(message, "❌ يرجى إدخال عدد صحيح")

# دالة معالجة أمر البيع
def handle_sell_command(message):
    if is_banned(message.from_user.id):
        return
    
    try:
        parts = message.text.split(None, 2)
        if len(parts) < 3:
            bot.reply_to(message, "❌ استخدم الصيغة: بيع [العدد] [اسم السلعة]")
            return
        
        quantity = int(parts[1])
        item = parts[2]
        user_id = str(message.from_user.id)
        
        if item not in SHOP_ITEMS:
            bot.reply_to(message, "❌ هذه السلعة غير معروفة")
            return
        
        if quantity <= 0:
            bot.reply_to(message, "❌ الكمية يجب أن تكون أكبر من صفر")
            return
        
        if user_id not in user_inventory or item not in user_inventory[user_id] or user_inventory[user_id][item] < quantity:
            bot.reply_to(message, "❌ لا تملك هذه الكمية من السلعة")
            return
        
        # حساب سعر البيع (75% من السعر الأصلي)
        original_price = SHOP_ITEMS[item]
        sell_price = int(original_price * 0.75 * quantity)
        
        # إضافة المال وإزالة العناصر
        add_money(message.from_user.id, sell_price)
        user_inventory[user_id][item] -= quantity
        
        if user_inventory[user_id][item] == 0:
            del user_inventory[user_id][item]
        
        save_data()
        
        balance = get_user_balance(message.from_user.id)
        bot.reply_to(message, 
            f"✅ تم بيع {quantity} {item}\n"
            f"💰 استرجعت 75% من المبلغ: {sell_price:,} د.ج\n"
            f"💵 رصيدك الحالي: {balance:,} د.ج")
            
    except ValueError:
        bot.reply_to(message, "❌ يرجى إدخال عدد صحيح")

# أوامر المطور
@bot.message_handler(commands=['ban'])
def ban_command(message):
    if str(message.from_user.id) != DEVELOPER_ID:
        bot.reply_to(message, "❌ هذا الأمر للمطور فقط")
        return
    
    try:
        user_id = message.text.split()[1]
        banned_users.add(user_id)
        save_data()
        bot.reply_to(message, f"✅ تم حظر المستخدم {user_id}")
    except IndexError:
        bot.reply_to(message, "❌ استخدم الصيغة: /ban [user_id]")

@bot.message_handler(commands=['unban'])
def unban_command(message):
    if str(message.from_user.id) != DEVELOPER_ID:
        bot.reply_to(message, "❌ هذا الأمر للمطور فقط")
        return
    
    try:
        user_id = message.text.split()[1]
        banned_users.discard(user_id)
        save_data()
        bot.reply_to(message, f"✅ تم إلغاء حظر المستخدم {user_id}")
    except IndexError:
        bot.reply_to(message, "❌ استخدم الصيغة: /unban [user_id]")

@bot.message_handler(commands=['stats'])
def stats_command(message):
    if str(message.from_user.id) != DEVELOPER_ID:
        bot.reply_to(message, "❌ هذا الأمر للمطور فقط")
        return
    
    stats_text = f"📊 **إحصائيات البوت:**\n"
    stats_text += f"👥 عدد المستخدمين: {len(user_accounts)}\n"
    stats_text += f"🚫 عدد المحظورين: {len(banned_users)}\n"
    stats_text += f"🎮 الألعاب النشطة: {len(game_sessions)}\n"
    
    bot.reply_to(message, stats_text, parse_mode='Markdown')

# معالج الأخطاء
@bot.message_handler(func=lambda message: True)
def handle_unknown(message):
    if is_banned(message.from_user.id):
        return
    
    # رسائل تفاعلية عشوائية
    responses = [
        "🤔 لم أفهم ما تقصده. جرب /start للمساعدة",
        "🎯 هل تريد لعب Spyfall؟ استخدم /newgame في المجموعة",
        "💡 للحصول على المساعدة، استخدم /start",
        "🕵️‍♂️ مرحباً! هل تريد البدء بلعبة جديدة؟"
    ]
    
    if random.randint(1, 3) == 1:  # رد عشوائي أحياناً
        bot.reply_to(message, random.choice(responses))

# دالة حفظ البيانات دورياً
def periodic_save():
    save_data()
    threading.Timer(300, periodic_save).start()  # كل 5 دقائق

# بدء الحفظ الدوري
periodic_save()

# تشغيل البوت
if __name__ == "__main__":
    print("🚀 بدء تشغيل البوت...")
    print("🎮 Spyfall Bot is running...")
    bot.infinity_polling(timeout=10, long_polling_timeout=5)
