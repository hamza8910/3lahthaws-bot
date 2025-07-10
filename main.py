import logging
import asyncio
import random
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Set
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ChatType, ChatMemberStatus

# إعداد التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# توكن البوت - ضع توكن البوت هنا
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# معرف المطور
DEVELOPER_ID = "6680350152"  # ضع معرف المطور هنا

# متغيرات عامة
games: Dict[int, Dict] = {}
user_data: Dict[int, Dict] = {}
banned_users: Set[int] = set()

# الأشياء والأماكن - ستضعها أنت
THINGS = [     "كسكس 🍲", "شخشوخة 🥣", "محاجب 🥞", "رفيس 🍵", "حريرة 🍲", "طاجين 🍖", "ملوخية 🍲", "رشتة 🍜", 
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
    "خيط 🧵" , "تطريز 🎨", "كروشي 🧶", "خياطة 👗", "زربية 🪞", "بساط 🧺", "سجاد 🧼", 
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

# البنوك المتاحة
BANKS = ["بدر", "الهلال", "أويحي"]

def load_user_data():
    """تحميل بيانات المستخدمين من ملف JSON"""
    global user_data, banned_users
    try:
        with open('user_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            user_data = data.get('users', {})
            user_data = {int(k): v for k, v in user_data.items()}
            banned_users = set(data.get('banned_users', []))
    except FileNotFoundError:
        user_data = {}
        banned_users = set()

def save_user_data():
    """حفظ بيانات المستخدمين في ملف JSON"""
    data = {
        'users': {str(k): v for k, v in user_data.items()},
        'banned_users': list(banned_users)
    }
    with open('user_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_user_data(user_id: int) -> Dict:
    """الحصول على بيانات المستخدم"""
    if user_id not in user_data:
        user_data[user_id] = {
            'balance': 0,
            'inventory': {},
            'bank_account': None,
            'account_number': None
        }
    return user_data[user_id]

def is_user_banned(user_id: int) -> bool:
    """التحقق من حظر المستخدم"""
    return user_id in banned_users

async def check_admin_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """التحقق من صلاحيات الإدارة"""
    if update.effective_chat.type == ChatType.PRIVATE:
        return True
    
    try:
        chat_member = await context.bot.get_chat_member(
            update.effective_chat.id, 
            context.bot.id
        )
        return chat_member.status == ChatMemberStatus.ADMINISTRATOR
    except:
        return False

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج أمر /start"""
    user_id = update.effective_user.id
    
    if is_user_banned(user_id):
        await update.message.reply_text(
            "أنت مقصي من اللعبة. اتصل بالمطور للإفراج عنك\n"
            f"المطور: @{DEVELOPER_ID}"
        )
        return
    
    if update.effective_chat.type != ChatType.PRIVATE:
        return
    
    # إرسال الصورة مع النص والأزرار
    keyboard = [
        [InlineKeyboardButton("🔘 اضغط هنا باه تفهم", callback_data="rules")],
        [InlineKeyboardButton("اضفني لمجموعتك لبدأ اللعبة", url="http://t.me/spy_spy_bbot?startgroup=new")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    caption = (
        "🕵️‍♂️ لعبة Spyfall هي لعبة اجتماعية قصيرة (3–30 لاعبين)\n"
        "يجتهد فيها \"الجاسوس\" في تخمين مكان سري،\n"
        "بينما يحاول الآخرون كشفه بأسئلة ذكية،\n"
        "أو ينتصر الجاسوس إذا ظل خفيًا أو خمن المكان.\n\n"
        "🔗 رابط المجموعة: https://t.me/+0ipdbPwuF304OWRk\n"
        f"👨‍💻 المطور: @{DEVELOPER_ID}"
    )
    
    try:
        await update.message.reply_photo(
            photo="https://pin.it/2qzWrzyQO",
            caption=caption,
            reply_markup=reply_markup
        )
    except:
        await update.message.reply_text(caption, reply_markup=reply_markup)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج الأزرار"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    chat_id = query.message.chat_id
    
    if is_user_banned(user_id):
        await query.message.reply_text(
            "أنت مقصي من اللعبة. اتصل بالمطور للإفراج عنك\n"
            f"المطور: @{DEVELOPER_ID}"
        )
        return
    
    if query.data == "rules":
        rules_text = (
            "📜 **قواعد اللعبة:**\n\n"
            "[●] ممنوع شخص يتسأل مرتين ورا بعض\n"
            "[●] أي لاعب يقدر دايما يبدأ تصويت على لاعب تاني شك فيه، والأغلبية تفوز\n"
            "[●] لو الأغلبية شكوا في لاعب، حقهم يعرفوا كان جاسوس ولا لأ، ولو كان جاسوس يطرد\n"
            "[●] لا يُحتسب صوت أي لاعب خرج بالتصويت حتى لو ما كانش جاسوس\n"
            "[●] كل دور هيكون فيه عدد فرص حسب عدد اللعيبة، والفرصة بتضيع مع كل لعيب بيطرد وهو مش جاسوس\n"
            "[●] لو الوقت خلص قبل ما الجواسيس كلهم يتطردوا، 🕒 الجواسيس يكسبوا\n"
            "[●] محدش عارف مين جاسوس ومين لأ، فكر كويس وخلي أسئلتك ذكية ومش بتفضح المكان أو الأكلة\n"
            "[●] لو الجاسوس عرف المكان أو الأكلة، ممكن يوقف الدور في أي وقت ويعلن تخمينه:\n"
            "    – لو صح ➡️ تنتهي الدور بفوز الجواسيس\n"
            "    – لو غلط ➡️ يطرد والدور يكمل عادي\n"
            "[●] هدف الجواسيس: إنهم ما يتعرفوش ويعرفوا المكان أو الأكلة قبل ما الوقت يخلص\n"
            "[●] هدف الباقي: إكتشاف كل الجواسيس قبل ما الوقت يخلص\n"
            "[●] الجاسوس هي لعبة لـ 3 أو أكثر، مكونة من فرقتين:\n"
            "    – فريق يعرف المكان/الاكلـة\n"
            "    – فريق جواسيس مش عارفينه"
        )
        await query.message.reply_text(rules_text, parse_mode='Markdown')
    
    elif query.data == "start_game":
        if chat_id in games and games[chat_id]['status'] != 'finished':
            await query.message.reply_text("لا يمكن بداية لعبة جديدة حتى تكمل البارتية")
            return
        
        games[chat_id] = {
            'status': 'waiting_players',
            'players': [],
            'creator': user_id,
            'join_time': datetime.now() + timedelta(minutes=1, seconds=30)
        }
        
        keyboard = [
            [InlineKeyboardButton("🟢 انضم للعبة", callback_data="join_game")],
            [InlineKeyboardButton("🟠 كيفاه تتعلب هذي اللعبة", callback_data="how_to_play")],
            [InlineKeyboardButton("🟣 انضم للقناة للمزيد من المتعة", url="https://t.me/+0ipdbPwuF304OWRk")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "🟢 تم بدء اللعبة! انضموا الآن\n⏳ وقت الانضمام: دقيقة ونصف",
            reply_markup=reply_markup
        )
        
        # جدولة انتهاء فترة الانضمام
        context.job_queue.run_once(
            end_join_period,
            90,  # 90 ثانية
            data={'chat_id': chat_id}
        )
    
    elif query.data == "join_game":
        if chat_id not in games:
            await query.message.reply_text("لا توجد لعبة نشطة حاليًا")
            return
        
        if games[chat_id]['status'] != 'waiting_players':
            await query.message.reply_text("انتهت فترة الانضمام")
            return
        
        if user_id in [p['id'] for p in games[chat_id]['players']]:
            await query.message.reply_text("أنت مسجل بالفعل في اللعبة")
            return
        
        games[chat_id]['players'].append({
            'id': user_id,
            'name': query.from_user.first_name,
            'username': query.from_user.username
        })
        
        players_list = "\n".join([
            f"{i+1}. {p['name']}" 
            for i, p in enumerate(games[chat_id]['players'])
        ])
        
        await query.message.edit_text(
            f"🟢 اللاعبون المسجلون:\n{players_list}\n\n"
            "⏳ وقت الانضمام متبقي",
            reply_markup=query.message.reply_markup
        )
    
    elif query.data == "how_to_play":
        rules_text = (
            "📜 **قواعد اللعبة:**\n\n"
            "[●] ممنوع شخص يتسأل مرتين ورا بعض\n"
            "[●] أي لاعب يقدر دايما يبدأ تصويت على لاعب تاني شك فيه، والأغلبية تفوز\n"
            "[●] لو الأغلبية شكوا في لاعب، حقهم يعرفوا كان جاسوس ولا لأ، ولو كان جاسوس يطرد\n"
            "[●] لا يُحتسب صوت أي لاعب خرج بالتصويت حتى لو ما كانش جاسوس\n"
            "[●] كل دور هيكون فيه عدد فرص حسب عدد اللعيبة، والفرصة بتضيع مع كل لعيب بيطرد وهو مش جاسوس\n"
            "[●] لو الوقت خلص قبل ما الجواسيس كلهم يتطردوا، 🕒 الجواسيس يكسبوا\n"
            "[●] محدش عارف مين جاسوس ومين لأ، فكر كويس وخلي أسئلتك ذكية ومش بتفضح المكان أو الأكلة\n"
            "[●] لو الجاسوس عرف المكان أو الأكلة، ممكن يوقف الدور في أي وقت ويعلن تخمينه:\n"
            "    – لو صح ➡️ تنتهي الدور بفوز الجواسيس\n"
            "    – لو غلط ➡️ يطرد والدور يكمل عادي\n"
            "[●] هدف الجواسيس: إنهم ما يتعرفوش ويعرفوا المكان أو الأكلة قبل ما الوقت يخلص\n"
            "[●] هدف الباقي: إكتشاف كل الجواسيس قبل ما الوقت يخلص\n"
            "[●] الجاسوس هي لعبة لـ 3 أو أكثر، مكونة من فرقتين:\n"
            "    – فريق يعرف المكان/الاكلـة\n"
            "    – فريق جواسيس مش عارفينه"
        )
        await context.bot.send_message(user_id, rules_text, parse_mode='Markdown')
    
    elif query.data in ["things", "places"]:
        if chat_id not in games:
            return
        
        games[chat_id]['game_type'] = query.data
        games[chat_id]['status'] = 'setting_players'
        
        await query.edit_message_text(
            "📝 كم عدد الأشخاص العاديين؟\n(من 3 إلى 30)"
        )
    
    elif query.data.startswith("vote_"):
        target_id = int(query.data.split("_")[1])
        await handle_vote(update, context, user_id, target_id, chat_id)
    
    elif query.data.startswith("buy_"):
        item = query.data.split("_", 1)[1]
        await handle_purchase(update, context, user_id, item)
    
    elif query.data.startswith("sell_"):
        item = query.data.split("_", 1)[1]
        await handle_sell(update, context, user_id, item)
    
    elif query.data.startswith("bank_"):
        bank = query.data.split("_", 1)[1]
        await handle_bank_selection(update, context, user_id, bank)

async def end_join_period(context: ContextTypes.DEFAULT_TYPE) -> None:
    """انتهاء فترة الانضمام"""
    chat_id = context.job.data['chat_id']
    
    if chat_id not in games:
        return
    
    if len(games[chat_id]['players']) < 3:
        await context.bot.send_message(
            chat_id, 
            "عدد اللاعبين غير كافٍ لبدء اللعبة (الحد الأدنى 3 لاعبين)"
        )
        del games[chat_id]
        return
    
    keyboard = [
        [InlineKeyboardButton("📦 اشياء", callback_data="things")],
        [InlineKeyboardButton("📍 اماكن", callback_data="places")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await context.bot.send_message(
        chat_id,
        "واش حابين؟",
        reply_markup=reply_markup
    )

async def newgame(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج أمر /newgame"""
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    
    if update.effective_chat.type == ChatType.PRIVATE:
        await update.message.reply_text("هذا الأمر يعمل في المجموعات فقط")
        return
    
    if is_user_banned(user_id):
        await update.message.reply_text(
            "أنت مقصي من اللعبة. اتصل بالمطور للإفراج عنك\n"
            f"المطور: @{DEVELOPER_ID}"
        )
        return
    
    if not await check_admin_status(update, context):
        await update.message.reply_text("لا استطيع اكمال اللعبة الا عند رفعي ادمن")
        return
    
    if chat_id in games and games[chat_id]['status'] != 'finished':
        await update.message.reply_text("لا يمكن بداية لعبة جديدة حتى تكمل البارتية")
        return
    
    keyboard = [
        [InlineKeyboardButton("🔵 أبدا اللعبة", callback_data="start_game")],
        [InlineKeyboardButton("🟠 كيفاه تتعلب هذي اللعبة", callback_data="how_to_play")],
        [InlineKeyboardButton("🟣 انضم للقناة للمزيد من المتعة", url="https://t.me/+0ipdbPwuF304OWRk")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🤔 حاب تبدا تلعب؟",
        reply_markup=reply_markup
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج الرسائل النصية"""
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    text = update.message.text
    
    if chat_id not in games:
        return
    
    game = games[chat_id]
    
    if game['status'] == 'setting_players' and text.isdigit():
        players_count = int(text)
        if 3 <= players_count <= 30:
            game['normal_players'] = players_count
            game['status'] = 'setting_spies'
            await update.message.delete()
            await context.bot.send_message(
                chat_id,
                "📝 كم عدد الجواسيس؟\n(من 1 إلى 10)"
            )
        else:
            await update.message.reply_text("يجب أن يكون العدد بين 3 و 30")
    
    elif game['status'] == 'setting_spies' and text.isdigit():
        spies_count = int(text)
        normal_players = game['normal_players']
        
        # التحقق من قيود الجواسيس
        max_spies = max(1, normal_players // 3)
        
        if spies_count > max_spies:
            if 3 <= normal_players <= 5:
                await update.message.reply_text("لا يمكن ذلك يمكنك اختيار فقط جاسوس واحد")
            else:
                await update.message.reply_text(f"لا يمكن اختيار أكثر من {max_spies} جواسيس")
            return
        
        if 1 <= spies_count <= 10:
            game['spies_count'] = spies_count
            game['status'] = 'setting_time'
            await update.message.delete()
            await context.bot.send_message(
                chat_id,
                "📝 كم دقيقة تريدون هذه البارتية؟\n(من 1 إلى 15)"
            )
        else:
            await update.message.reply_text("يجب أن يكون العدد بين 1 و 10")
    
    elif game['status'] == 'setting_time' and text.isdigit():
        time_minutes = int(text)
        if 1 <= time_minutes <= 15:
            game['game_time'] = time_minutes
            game['status'] = 'waiting_roles'
            await update.message.delete()
            await context.bot.send_message(
                chat_id,
                "ارسل لي كلمة start في الخاص ل ترى دورك"
            )
            await distribute_roles(context, chat_id)
        else:
            await update.message.reply_text("يجب أن يكون الوقت بين 1 و 15 دقيقة")
    
    elif text.lower() == "start" and update.effective_chat.type == ChatType.PRIVATE:
        await handle_private_start(update, context, user_id)

async def distribute_roles(context: ContextTypes.DEFAULT_TYPE, chat_id: int) -> None:
    """توزيع الأدوار على اللاعبين"""
    game = games[chat_id]
    players = game['players']
    
    # اختيار الجواسيس عشوائياً
    spies = random.sample(players, game['spies_count'])
    spy_ids = [spy['id'] for spy in spies]
    
    # اختيار المكان/الشيء
    if game['game_type'] == 'places':
        location = random.choice(PLACES)
    else:
        location = random.choice(THINGS)
    
    game['spies'] = spy_ids
    game['location'] = location
    game['roles_distributed'] = True

async def handle_private_start(update: Update, context: ContextTypes.DEFAULT_TYPE, user_id: int) -> None:
    """معالج كلمة start في الخاص"""
    # البحث عن اللعبة التي ينتمي إليها المستخدم
    user_game = None
    user_chat_id = None
    
    for chat_id, game in games.items():
        if game.get('roles_distributed') and user_id in [p['id'] for p in game['players']]:
            user_game = game
            user_chat_id = chat_id
            break
    
    if not user_game:
        await update.message.reply_text("لا توجد لعبة نشطة لك")
        return
    
    # إرسال الدور للمستخدم
    if user_id in user_game['spies']:
        try:
            await update.message.reply_photo(
                photo="https://pin.it/2Xv5gZUHU",
                caption="أنت هو الجاسوس 🕵️‍♂️\nاعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!"
            )
        except:
            await update.message.reply_text(
                "أنت هو الجاسوس 🕵️‍♂️\nاعرف كيفاه تلعب وتجاوب، ماتخليهمش يكشفوك!"
            )
    else:
        location_type = "الموقع" if user_game['game_type'] == 'places' else "الشيء"
        await update.message.reply_text(
            f"أنت ماكش جاسوس 🚫🕵️\n{location_type}: {user_game['location']}"
        )
    
    # التحقق من توزيع جميع الأدوار
    if not user_game.get('all_roles_sent'):
        user_game['roles_sent'] = user_game.get('roles_sent', 0) + 1
        if user_game['roles_sent'] >= len(user_game['players']):
            user_game['all_roles_sent'] = True
            user_game['status'] = 'playing'
            
            # بدء اللعبة
            await context.bot.send_message(
                user_chat_id,
                "صَيَّبو مدينا الأدوار، ابداو تلعبو! 🎲🕰️"
            )
            
            # جدولة انتهاء اللعبة والتصويت
            game_time_seconds = user_game['game_time'] * 60
            voting_time = game_time_seconds - 40
            
            context.job_queue.run_once(
                start_voting,
                voting_time,
                data={'chat_id': user_chat_id}
            )

async def start_voting(context: ContextTypes.DEFAULT_TYPE) -> None:
    """بدء التصويت"""
    chat_id = context.job.data['chat_id']
    
    if chat_id not in games:
        return
    
    game = games[chat_id]
    players = game['players']
    
    # إرسال رسالة التصويت في المجموعة
    await context.bot.send_message(
        chat_id,
        "⏰ أرسلت لكم التصويت في الخاص"
    )
    
    # إرسال أزرار التصويت لكل لاعب
    for player in players:
        keyboard = []
        for other_player in players:
            if other_player['id'] != player['id']:
                keyboard.append([
                    InlineKeyboardButton(
                        other_player['name'],
                        callback_data=f"vote_{other_player['id']}"
                    )
                ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        try:
            await context.bot.send_message(
                player['id'],
                "على من تصوت أنه الجاسوس؟",
                reply_markup=reply_markup
            )
        except:
            pass  # في حالة عدم قدرة البوت على إرسال رسالة للمستخدم
    
    game['status'] = 'voting'
    game['votes'] = {}

async def handle_vote(update: Update, context: ContextTypes.DEFAULT_TYPE, voter_id: int, target_id: int, chat_id: int) -> None:
    """معالج التصويت"""
    # البحث عن اللعبة
    user_game = None
    user_chat_id = None
    
    for cid, game in games.items():
        if game.get('status') == 'voting' and voter_id in [p['id'] for p in game['players']]:
            user_game = game
            user_chat_id = cid
            break
    
    if not user_game:
        await update.callback_query.answer("لا توجد لعبة نشطة")
        return
    
    if voter_id in user_game['votes']:
        await update.callback_query.answer("لقد صوتت بالفعل")
        return
    
    user_game['votes'][voter_id] = target_id
    
    # العثور على أسماء المصوت والمستهدف
    voter_name = None
    target_name = None
    
    for player in user_game['players']:
        if player['id'] == voter_id:
            voter_name = player['name']
        if player['id'] == target_id:
            target_name = player['name']
    
    # إرسال رسالة التصويت في المجموعة
    await context.bot.send_message(
        user_chat_id,
        f"{voter_name} صوت لإعدام {target_name} 🗳️"
    )
    
    await update.callback_query.answer("تم تسجيل صوتك")
    
    # التحقق من اكتمال التصويت
    if len(user_game['votes']) >= len(user_game['players']):
        await finish_voting(context, user_chat_id)

async def finish_voting(context: ContextTypes.DEFAULT_TYPE, chat_id: int) -> None:
    """إنهاء التصويت وإعلان النتائج"""
    game = games[chat_id]
    
    # حساب الأصوات
    vote_counts = {}
    for target_id in game['votes'].values():
        vote_counts[target_id] = vote_counts.get(target_id, 0) + 1
    
    # العثور على الأكثر أصواتاً
    max_votes = max(vote_counts.values())
    most_voted = [uid for uid, count in vote_counts.items() if count == max_votes]
    
    if len(most_voted) > 1:
        # تعادل في الأصوات
        await context.bot.send_message(
            chat_id,
            "حدث تعادل في التصويت! 🤝"
        )
        winner = "spies"  # الجواسيس يفوزون في حالة التعادل
    else:
        eliminated_id = most_voted[0]
        
        # التحقق من كون المصوت عليه جاسوس
        if eliminated_id in game['spies']:
            winner = "players"
        else:
            winner = "spies"
    
    # إعلان النتائج
    await announce_results(context, chat_id, winner)

async def announce_results(context: ContextTypes.DEFAULT_TYPE, chat_id: int, winner: str) -> None:
    """إعلان نتائج اللعبة"""
    game = games[chat_id]
    
    # إرسال المكان/الشيء
    location_type = "الموقع" if game['game_type'] == 'places' else "الشيء"
    await context.bot.send_message(
        chat_id,
        f"📍📦 {location_type} كان: {game['location']}"
    )
    
    # إرسال قائمة اللاعبين وأدوارهم
    players_info = []
    for player in game['players']:
        role = "جاسوس 🕵️‍♂️" if player['id'] in game['spies'] else "لاعب عادي 👤"
        result = "ربح" if (winner == "spies" and player['id'] in game['spies']) or (winner == "players" and player['id'] not in game['spies']) else "خسر"
        players_info.append(f"{player['name']} - {role} - {result}")
    
    players_list = "\n".join(players_info)
    await context.bot.send_message(
        chat_id,
        f"📋 نتائج اللعبة:\n{players_list}"
    )
    
    # إرسال رسالة الفوز والجوائز
    if winner == "spies":
        try:
            await context.bot.send_video(
                chat_id,
                video="https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/spy_win.mp4",
                caption=(
                    "فاز الجاسوس! 🎉\n"
                    "حصل على جائزة مالية 2,000,000,000 د.ج 💰\n\n"
                    "عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، "
                    f"ارسلوا أسمائهم لـ @{DEVELOPER_ID} ليخرجهم من اللعبة نهائيًا."
                )
            )
        except:
            await context.bot.send_message(
                chat_id,
                "فاز الجاسوس! 🎉\n"
                "حصل على جائزة مالية 2,000,000,000 د.ج 💰\n\n"
                "عاقبوا اللاعبين بما تريدون، وإذا لم يطبقوا الحكم، "
                f"ارسلوا أسمائهم لـ @{DEVELOPER_ID} ليخرجهم من اللعبة نهائيًا."
            )
        
        # إضافة الجائزة للجواسيس
        for spy_id in game['spies']:
            user_data_spy = get_user_data(spy_id)
            user_data_spy['balance'] += 2000000000
    
    else:
        try:
            await context.bot.send_video(
                chat_id,
                video="https://raw.githubusercontent.com/hamza8910/3lahthaws-bot/main/assets/players_win.mp4",
                caption=(
                    "فاز اللاعبون! 🎊\n"
                    "كل لاعب حصل على 100,000 د.ج 💸\n\n"
                    "عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، "
                    f"ارسلوا اسمه لـ @{DEVELOPER_ID} ليُقصى نهائيًا."
                )
            )
        except:
            await context.bot.send_message(
                chat_id,
                "فاز اللاعبون! 🎊\n"
                "كل لاعب حصل على 100,000 د.ج 💸\n\n"
                "عاقبوا الجاسوس بما تريدون، وإذا لم تُطبق العقوبة، "
                f"ارسلوا اسمه لـ @{DEVELOPER_ID} ليُقصى نهائيًا."
            )
        
        # إضافة الجائزة للاعبين العاديين
        for player in game['players']:
            if player['id'] not in game['spies']:
                user_data_player = get_user_data(player['id'])
                user_data_player['balance'] += 100000
    
    # حفظ البيانات وإنهاء اللعبة
    save_user_data()
    game['status'] = 'finished'

# أوامر المتجر والبنك
async def shop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """عرض المتجر"""
    keyboard = []
    for item, price in SHOP_ITEMS.items():
        keyboard.append([
            InlineKeyboardButton(
                f"{item} - {price:,} د.ج",
                callback_data=f"buy_{item}"
            )
        ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🛒 مرحباً بك في المتجر!\nاختر ما تريد شراءه:",
        reply_markup=reply_markup
    )

async def handle_purchase(update: Update, context: ContextTypes.DEFAULT_TYPE, user_id: int, item: str) -> None:
    """معالج الشراء"""
    user_data_buyer = get_user_data(user_id)
    
    if item not in SHOP_ITEMS:
        await update.callback_query.answer("العنصر غير متوفر")
        return
    
    price = SHOP_ITEMS[item]
    
    if user_data_buyer['balance'] < price:
        await update.callback_query.answer("رصيدك غير كافٍ")
        return
    
    user_data_buyer['balance'] -= price
    user_data_buyer['inventory'][item] = user_data_buyer['inventory'].get(item, 0) + 1
    
    await update.callback_query.answer("تم الشراء بنجاح!")
    await update.callback_query.message.reply_text(
        f"لقد اشتريت 1 {item} بسعر {price:,} د.ج 💵\n"
        f"تبقى لديك {user_data_buyer['balance']:,} د.ج"
    )
    
    save_user_data()

async def sell(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """عرض عناصر البيع"""
    user_id = update.effective_user.id
    user_data_seller = get_user_data(user_id)
    
    if not user_data_seller['inventory']:
        await update.message.reply_text("لا تملك أي عناصر للبيع")
        return
    
    keyboard = []
    for item, quantity in user_data_seller['inventory'].items():
        if quantity > 0:
            keyboard.append([
                InlineKeyboardButton(
                    f"{item} ({quantity})",
                    callback_data=f"sell_{item}"
                )
            ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "💰 اختر ما تريد بيعه:",
        reply_markup=reply_markup
    )

async def handle_sell(update: Update, context: ContextTypes.DEFAULT_TYPE, user_id: int, item: str) -> None:
    """معالج البيع"""
    user_data_seller = get_user_data(user_id)
    
    if item not in user_data_seller['inventory'] or user_data_seller['inventory'][item] <= 0:
        await update.callback_query.answer("لا تملك هذا العنصر")
        return
    
    # حساب سعر البيع (75% من سعر الشراء)
    original_price = SHOP_ITEMS[item]
    sell_price = int(original_price * 0.75)
    
    user_data_seller['inventory'][item] -= 1
    user_data_seller['balance'] += sell_price
    
    await update.callback_query.answer("تم البيع بنجاح!")
    await update.callback_query.message.reply_text(
        f"استرجعت 75% من المبلغ الذي اشتريت به السلعة.\n"
        f"حصلت على {sell_price:,} د.ج 💰"
    )
    
    save_user_data()

async def bank_account(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """فتح حساب بنكي"""
    keyboard = []
    for bank in BANKS:
        keyboard.append([
            InlineKeyboardButton(bank, callback_data=f"bank_{bank}")
        ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🏦 اختر البنك:",
        reply_markup=reply_markup
    )

async def handle_bank_selection(update: Update, context: ContextTypes.DEFAULT_TYPE, user_id: int, bank: str) -> None:
    """معالج اختيار البنك"""
    user_data_banker = get_user_data(user_id)
    
    if user_data_banker['bank_account']:
        await update.callback_query.answer("لديك حساب بنكي بالفعل")
        return
    
    # إنشاء رقم حساب عشوائي
    account_number = f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    user_data_banker['bank_account'] = bank
    user_data_banker['account_number'] = account_number
    
    await update.callback_query.answer("تم فتح الحساب بنجاح!")
    await update.callback_query.message.reply_text(
        f"تم فتح الحساب في بنك {bank}\n"
        f"رصيدك: {user_data_banker['balance']:,} د.ج\n"
        f"رقم الحساب: {account_number}"
    )
    
    save_user_data()

async def transfer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """تحويل الأموال"""
    user_id = update.effective_user.id
    user_data_sender = get_user_data(user_id)
    
    if not user_data_sender['bank_account']:
        await update.message.reply_text("يجب أن تفتح حساب بنكي أولاً")
        return
    
    if not context.args:
        await update.message.reply_text("استخدم: فارسي [المبلغ]")
        return
    
    try:
        amount = int(context.args[0])
    except ValueError:
        await update.message.reply_text("المبلغ يجب أن يكون رقماً")
        return
    
    if amount <= 0:
        await update.message.reply_text("المبلغ يجب أن يكون أكبر من صفر")
        return
    
    # حساب العمولة (15%)
    commission = int(amount * 0.15)
    total_amount = amount + commission
    
    if user_data_sender['balance'] < total_amount:
        await update.message.reply_text("رصيدك غير كافٍ (مع العمولة)")
        return
    
    # حفظ معلومات التحويل مؤقتاً
    context.user_data['transfer_amount'] = amount
    context.user_data['transfer_commission'] = commission
    context.user_data['awaiting_account'] = True
    
    await update.message.reply_text(
        f"ارسل رقم حساب المستفيد لتحويل {amount:,} د.ج\n"
        f"العمولة: {commission:,} د.ج\n"
        f"المبلغ الإجمالي: {total_amount:,} د.ج"
    )

async def my_items(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """عرض ممتلكات المستخدم"""
    user_id = update.effective_user.id
    user_data_owner = get_user_data(user_id)
    
    inventory_text = "✨ ممتلكاتي:\n\n"
    inventory_text += f"💰 الرصيد: {user_data_owner['balance']:,} د.ج\n\n"
    
    if user_data_owner['inventory']:
        inventory_text += "🎒 العناصر:\n"
        for item, quantity in user_data_owner['inventory'].items():
            if quantity > 0:
                inventory_text += f"• {item}: {quantity}\n"
    else:
        inventory_text += "🎒 لا تملك أي عناصر\n"
    
    if user_data_owner['bank_account']:
        inventory_text += f"\n🏦 البنك: {user_data_owner['bank_account']}\n"
        inventory_text += f"📄 رقم الحساب: {user_data_owner['account_number']}"
    
    await update.message.reply_text(inventory_text)

async def handle_account_number(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج رقم الحساب للتحويل"""
    if not context.user_data.get('awaiting_account'):
        return
    
    user_id = update.effective_user.id
    user_data_sender = get_user_data(user_id)
    account_number = update.message.text
    
    # البحث عن المستفيد
    recipient_id = None
    for uid, data in user_data.items():
        if data.get('account_number') == account_number:
            recipient_id = uid
            break
    
    if not recipient_id:
        await update.message.reply_text("رقم الحساب غير صحيح")
        return
    
    if recipient_id == user_id:
        await update.message.reply_text("لا يمكنك التحويل لنفسك")
        return
    
    # تنفيذ التحويل
    amount = context.user_data['transfer_amount']
    commission = context.user_data['transfer_commission']
    total_amount = amount + commission
    
    user_data_sender['balance'] -= total_amount
    user_data_recipient = get_user_data(recipient_id)
    user_data_recipient['balance'] += amount
    
    await update.message.reply_text(
        f"تم التحويل بنجاح! 💸\n"
        f"المبلغ: {amount:,} د.ج\n"
        f"العمولة: {commission:,} د.ج\n"
        f"رصيدك الحالي: {user_data_sender['balance']:,} د.ج"
    )
    
    # إشعار المستفيد
    try:
        await context.bot.send_message(
            recipient_id,
            f"تم تحويل {amount:,} د.ج إلى حسابك 💰\n"
            f"رصيدك الحالي: {user_data_recipient['balance']:,} د.ج"
        )
    except:
        pass
    
    # مسح البيانات المؤقتة
    context.user_data.clear()
    save_user_data()

# أوامر الإدارة
async def ban_user(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """حظر مستخدم (للمطور فقط)"""
    if update.effective_user.id != 6680350152:  # معرف المطور الرقمي
        return

    if not context.args:
        await update.message.reply_text("استخدم: /ban [معرف المستخدم]")
        return

    try:
        user_id = int(context.args[0])
        banned_users.add(user_id)
        save_user_data()
        await update.message.reply_text(f"تم حظر المستخدم {user_id}")
    except ValueError:
        await update.message.reply_text("معرف المستخدم يجب أن يكون رقماً")

async def unban_user(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """إلغاء حظر مستخدم (للمطور فقط)"""
    if update.effective_user.id != 6680350152:  # معرف المطور الرقمي
        return

    if not context.args:
        await update.message.reply_text("استخدم: /unban [معرف المستخدم]")
        return

    try:
        user_id = int(context.args[0])
        banned_users.discard(user_id)
        save_user_data()
        await update.message.reply_text(f"تم إلغاء حظر المستخدم {user_id}")
    except ValueError:
        await update.message.reply_text("معرف المستخدم يجب أن يكون رقماً")

async def group_joined(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """عند إضافة البوت للمجموعة"""
    for member in update.message.new_chat_members:
        if member.id == context.bot.id:
            await update.message.reply_text(
                "👋 شكرًا لإضافتي!\n"
                "اضغط على /newgame للبدء."
            )
            break


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """معالج الأخطاء"""
    logger.error(f"Exception while handling an update: {context.error}")

def main() -> None:
    """الدالة الرئيسية"""
    # تحميل بيانات المستخدمين
    load_user_data()
    
    # إنشاء التطبيق
    application = Application.builder().token(BOT_TOKEN).build()
    
    # إضافة المعالجات
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("newgame", newgame))
    application.add_handler(CommandHandler("shop", shop))
    application.add_handler(CommandHandler("sell", sell))
    application.add_handler(CommandHandler("حلي_بونكا", bank_account))
    application.add_handler(CommandHandler("فارسي", transfer))
    application.add_handler(CommandHandler("ممتلكاتي", my_items))
    application.add_handler(CommandHandler("ban", ban_user))
    application.add_handler(CommandHandler("unban", unban_user))
    
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, group_joined))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # معالج الأخطاء
    application.add_error_handler(error_handler)
    
    # تشغيل البوت
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
