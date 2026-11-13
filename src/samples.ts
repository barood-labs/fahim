import type { Reading, ReplyIntent } from "./domain/types";

export interface SampleDocument {
  id: "school" | "lease" | "clinic" | "maintenance";
  text: string;
  match: (text: string) => boolean;
  replies: Record<ReplyIntent, { en: string; ar: string }>;
  reading: Omit<Reading, "replyEn" | "replyAr">;
}

const CAVEAT_EN =
  "This is a reading aid, not legal, medical, or financial advice. Confirm dates and amounts on the original before you act.";
const CAVEAT_AR =
  "هذه مساعدة على القراءة، وليست استشارة قانونية أو طبية أو مالية. راجعوا التواريخ والمبالغ في الرسالة الأصلية قبل أي خطوة.";

export const samples: SampleDocument[] = [
  {
    id: "school",
    match: (text) => /city museum/i.test(text) && /permission/i.test(text),
    text: `From: Ms. Elena Alvarez <ealvarez@lincoln-elementary.example>
To: Families of Room 12
Subject: Field trip permission — City Museum, Friday, November 20

Hello families,

Room 12 will visit the City Museum on Friday, November 20, 2026. The bus leaves school at 9:15 a.m. and returns by 1:45 p.m.

Please sign and return the permission slip by Wednesday, November 18. The trip fee is $12, cash or check payable to Lincoln Elementary. Students should bring a sack lunch. The museum café is closed that day.

If your child needs a medical note or cannot attend, call the office at (555) 014-2280 or email me. Students who stay at school will join Room 11 for the morning.

Thank you,
Elena Alvarez
Room 12 teacher`,
    reading: {
      sourceLanguage: "English",
      summaryEn:
        "Room 12 is going to the City Museum on Friday, November 20, 2026. The bus leaves at 9:15 a.m. and is back by 1:45 p.m. You need a signed permission slip by Wednesday, November 18, and $12. Pack a lunch. Call the office if your child cannot go.",
      summaryAr:
        "رحلة الصف ١٢ إلى متحف المدينة يوم الجمعة ٢٠ نوفمبر ٢٠٢٦. تغادر الحافلة الساعة ٩:١٥ صباحاً وتعود بحدود ١:٤٥ ظهراً. المطلوب توقيع ورقة الإذن وإرجاعها قبل يوم الأربعاء ١٨ نوفمبر، مع رسم قدره ١٢ دولاراً. أحضروا غداءً مع الطفل. اتصلوا بالمكتب إذا لم يستطع الحضور.",
      whatToDoEn: "Sign the slip, return it by November 18, and send $12. Pack a lunch.",
      whatToDoAr: "وقّعوا ورقة الإذن وأعيدوها قبل ١٨ نوفمبر، وأرسلوا ١٢ دولاراً، وجهّزوا غداءً.",
      actions: [
        { id: "a1", textEn: "Sign the permission slip and return it.", textAr: "وقّعوا ورقة الإذن وأعيدوها.", due: "Wednesday, November 18, 2026" },
        { id: "a2", textEn: "Send $12, cash or check, payable to Lincoln Elementary.", textAr: "أرسلوا ١٢ دولاراً نقداً أو بشيك باسم المدرسة.", due: "Wednesday, November 18, 2026" },
        { id: "a3", textEn: "Pack a sack lunch. The museum café is closed.", textAr: "جهّزوا غداءً مع الطفل. مقهى المتحف مغلق.", due: "Friday, November 20, 2026" },
        { id: "a4", textEn: "Call the office if your child cannot attend or needs a medical note.", textAr: "اتصلوا بالمكتب إذا لم يستطع الطفل الحضور أو احتاج مذكرة طبية.", due: null },
      ],
      dates: [
        { labelEn: "Trip", labelAr: "الرحلة", value: "Friday, November 20, 2026, 9:15 a.m.–1:45 p.m." },
        { labelEn: "Permission due", labelAr: "موعد ورقة الإذن", value: "Wednesday, November 18, 2026" },
      ],
      amounts: [{ labelEn: "Trip fee", labelAr: "رسم الرحلة", value: "$12" }],
      contacts: [
        { name: "Elena Alvarez", roleEn: "Room 12 teacher", roleAr: "معلمة الصف ١٢", phone: null, email: "ealvarez@lincoln-elementary.example" },
        { name: "School office", roleEn: "Attendance and medical notes", roleAr: "الحضور والمذكرات الطبية", phone: "(555) 014-2280", email: null },
      ],
      caveatEn: CAVEAT_EN,
      caveatAr: CAVEAT_AR,
    },
    replies: {
      acknowledge: {
        en: "Dear Ms. Alvarez,\n\nThank you for the note. [Child's name] will join the City Museum trip on Friday, November 20. I will return the signed permission slip by Wednesday, November 18, and send the $12 fee.\n\n[your name]",
        ar: "السيدة ألفاريز المحترمة،\n\nشكراً لكم على الرسالة. سينضم [اسم الطفل] إلى رحلة متحف المدينة يوم الجمعة ٢٠ نوفمبر. سأعيد ورقة الإذن موقعة قبل يوم الأربعاء ١٨ نوفمبر، وأرسل رسم ١٢ دولاراً.\n\n[اسمكم]",
      },
      question: {
        en: "Dear Ms. Alvarez,\n\nThank you for the note about the City Museum trip on November 20. Should I still send the $12 fee if [Child's name] needs a medical note and may have to stay with Room 11?\n\n[your name]",
        ar: "السيدة ألفاريز المحترمة،\n\nشكراً لكم على رسالة رحلة متحف المدينة يوم ٢٠ نوفمبر. هل أرسل رسم ١٢ دولاراً إذا احتاج [اسم الطفل] مذكرة طبية وبقي مع الصف ١١؟\n\n[اسمكم]",
      },
      decline: {
        en: "Dear Ms. Alvarez,\n\nThank you for the note. [Child's name] cannot attend the City Museum trip on November 20. Please seat them with Room 11 for the morning. Tell me if I still need to return a form.\n\n[your name]",
        ar: "السيدة ألفاريز المحترمة،\n\nشكراً لكم على الرسالة. لا يستطيع [اسم الطفل] حضور رحلة متحف المدينة يوم ٢٠ نوفمبر. أرجو أن يبقى مع الصف ١١ في الصباح. أخبروني إن كان يلزم إرجاع ورقة.\n\n[اسمكم]",
      },
    },
  },
  {
    id: "lease",
    match: (text) => /cedar court/i.test(text) && /rent/i.test(text),
    text: `NOTICE OF RENT ADJUSTMENT
Unit 4B, 180 Cedar Court

Dear Resident,

This is 30 days' written notice that your monthly rent will increase from $1,450 to $1,535 beginning January 1, 2027. That is an increase of $85.

The new amount is due on the first of each month. A late fee of $50 applies after the 5th. This change does not alter any other term of your lease.

Questions: Cedar Court Leasing, (555) 019-4412, leasing@cedarcourt.example. Office hours are Monday–Friday, 9 a.m. to 5 p.m.

You may reply in writing if you do not wish to renew. Please tell us by December 15, 2026.

Sincerely,
Jordan Hale
Property manager`,
    reading: {
      sourceLanguage: "English",
      summaryEn:
        "Cedar Court is raising the rent for unit 4B from $1,450 to $1,535 a month, an increase of $85, starting January 1, 2027. This is 30 days' notice. A $50 late fee applies after the 5th. If you do not want to renew, tell them in writing by December 15, 2026.",
      summaryAr:
        "مكتب سيدار كورت يرفع إيجار الشقة ٤ب من ١٤٥٠ إلى ١٥٣٥ دولاراً في الشهر، أي زيادة قدرها ٨٥ دولاراً، ابتداءً من ١ يناير ٢٠٢٧. هذا إشعار قبل ٣٠ يوماً. رسم التأخير ٥٠ دولاراً بعد اليوم الخامس. إذا لم ترغبوا في التجديد، أبلغوهم كتابةً قبل ١٥ ديسمبر ٢٠٢٦.",
      whatToDoEn: "Decide whether to stay at $1,535 or decline the renewal in writing by December 15.",
      whatToDoAr: "قرّروا البقاء بالإيجار الجديد أو رفض التجديد كتابةً قبل ١٥ ديسمبر.",
      actions: [
        { id: "a1", textEn: "Plan for the new rent of $1,535 starting January 1, 2027.", textAr: "جهّزوا الإيجار الجديد ١٥٣٥ دولاراً ابتداءً من ١ يناير ٢٠٢٧.", due: "January 1, 2027" },
        { id: "a2", textEn: "If you will not renew, reply in writing.", textAr: "إذا لن تجدّدوا، أرسلوا رداً مكتوباً.", due: "December 15, 2026" },
        { id: "a3", textEn: "Pay by the 5th to avoid the $50 late fee.", textAr: "ادفعوا قبل اليوم الخامس لتجنّب رسم ٥٠ دولاراً.", due: "The 5th of each month" },
      ],
      dates: [
        { labelEn: "New rent starts", labelAr: "بداية الإيجار الجديد", value: "January 1, 2027" },
        { labelEn: "Last day to decline renewal", labelAr: "آخر يوم لرفض التجديد", value: "December 15, 2026" },
        { labelEn: "Late fee starts", labelAr: "بداية رسم التأخير", value: "After the 5th of the month" },
      ],
      amounts: [
        { labelEn: "Current rent", labelAr: "الإيجار الحالي", value: "$1,450" },
        { labelEn: "New rent", labelAr: "الإيجار الجديد", value: "$1,535" },
        { labelEn: "Increase", labelAr: "الزيادة", value: "$85" },
        { labelEn: "Late fee", labelAr: "رسم التأخير", value: "$50" },
      ],
      contacts: [
        { name: "Jordan Hale", roleEn: "Property manager, Cedar Court Leasing", roleAr: "مدير العقار، تأجير سيدار كورت", phone: "(555) 019-4412", email: "leasing@cedarcourt.example" },
      ],
      caveatEn: CAVEAT_EN,
      caveatAr: CAVEAT_AR,
    },
    replies: {
      acknowledge: {
        en: "Dear Jordan Hale,\n\nI received the notice for unit 4B. I understand the rent becomes $1,535 on January 1, 2027.\n\n[your name]",
        ar: "الأستاذ جوردان هيل المحترم،\n\nاستلمت إشعار الشقة ٤ب. فهمت أن الإيجار سيصبح ١٥٣٥ دولاراً في ١ يناير ٢٠٢٧.\n\n[اسمكم]",
      },
      question: {
        en: "Dear Jordan Hale,\n\nI received the notice raising unit 4B from $1,450 to $1,535 on January 1, 2027. Does the $50 late fee apply to the new amount, and is December 15 the last day to say I will not renew?\n\n[your name]",
        ar: "الأستاذ جوردان هيل المحترم،\n\nاستلمت إشعار رفع إيجار الشقة ٤ب من ١٤٥٠ إلى ١٥٣٥ دولاراً في ١ يناير ٢٠٢٧. هل ينطبق رسم التأخير ٥٠ دولاراً على المبلغ الجديد؟ وهل ١٥ ديسمبر آخر يوم لإبلاغكم أنني لن أجدّد؟\n\n[اسمكم]",
      },
      decline: {
        en: "Dear Jordan Hale,\n\nI do not wish to renew the lease for unit 4B at the new rent. Please confirm what I should sign and when I should return the keys.\n\n[your name]",
        ar: "الأستاذ جوردان هيل المحترم،\n\nلا أرغب في تجديد عقد الشقة ٤ب بالإيجار الجديد. أرجو تأكيد ما الذي أوقّعه ومتى أسلّم المفاتيح.\n\n[اسمكم]",
      },
    },
  },
  {
    id: "clinic",
    match: (text) => /fasting/i.test(text) && /riverside/i.test(text),
    text: `Riverside Clinic
Appointment reminder for Samir Haddad

Your fasting blood test is Tuesday, November 24, 2026 at 8:10 a.m.
Location: Riverside Clinic, Lab Desk B, 900 West Elm.

Do not eat or drink anything except water after midnight the night before. Take your usual morning medicines unless Dr. Okonkwo told you not to. Bring a photo ID and your insurance card.

If you need to reschedule, call (555) 017-9033 before Monday at 4 p.m. Missing the visit without notice may add a $25 fee.

This message is a reminder, not a diagnosis.`,
    reading: {
      sourceLanguage: "English",
      summaryEn:
        "Samir Haddad has a fasting blood test at Riverside Clinic, Lab Desk B, on Tuesday, November 24, 2026 at 8:10 a.m. After midnight, water only. Bring a photo ID and insurance card. To move the visit, call before Monday at 4 p.m. or a $25 fee may apply. This is a reminder, not a diagnosis.",
      summaryAr:
        "لسمير حداد تحليل دم صائم في عيادة ريفرسايد، مكتب المختبر ب، يوم الثلاثاء ٢٤ نوفمبر ٢٠٢٦ الساعة ٨:١٠ صباحاً. بعد منتصف الليل: الماء فقط. أحضروا هوية وصورة وبطاقة التأمين. لتغيير الموعد، اتصلوا قبل الاثنين الساعة ٤ عصراً، وإلا فقد يُضاف رسم ٢٥ دولاراً. هذه رسالة تذكير وليست تشخيصاً.",
      whatToDoEn: "Fast after midnight, come at 8:10 a.m. with ID and insurance, or call to reschedule before Monday at 4 p.m.",
      whatToDoAr: "صوموا بعد منتصف الليل، واحضروا الساعة ٨:١٠ مع الهوية والتأمين، أو اتصلوا لتغيير الموعد قبل الاثنين الساعة ٤.",
      actions: [
        { id: "a1", textEn: "Do not eat or drink anything except water after midnight.", textAr: "لا تأكلوا ولا تشربوا شيئاً غير الماء بعد منتصف الليل.", due: "The night before November 24" },
        { id: "a2", textEn: "Arrive at Lab Desk B at 8:10 a.m. with a photo ID and insurance card.", textAr: "احضروا إلى مكتب المختبر ب الساعة ٨:١٠ مع هوية وبطاقة التأمين.", due: "Tuesday, November 24, 2026, 8:10 a.m." },
        { id: "a3", textEn: "Take usual morning medicines unless Dr. Okonkwo said not to.", textAr: "خذوا أدوية الصباح المعتادة إلا إذا طلب الدكتور أوكونكو غير ذلك.", due: "Tuesday morning" },
        { id: "a4", textEn: "Call to reschedule before Monday at 4 p.m. to avoid a possible $25 fee.", textAr: "اتصلوا لتغيير الموعد قبل الاثنين الساعة ٤ لتجنّب رسم ٢٥ دولاراً.", due: "Monday at 4 p.m." },
      ],
      dates: [
        { labelEn: "Blood test", labelAr: "تحليل الدم", value: "Tuesday, November 24, 2026, 8:10 a.m." },
        { labelEn: "Last time to reschedule", labelAr: "آخر وقت لتغيير الموعد", value: "Monday at 4 p.m." },
      ],
      amounts: [{ labelEn: "Possible missed-visit fee", labelAr: "رسم محتمل عند الغياب دون إشعار", value: "$25" }],
      contacts: [
        { name: "Riverside Clinic", roleEn: "Lab Desk B, 900 West Elm", roleAr: "مكتب المختبر ب، ٩٠٠ ويست إلم", phone: "(555) 017-9033", email: null },
        { name: "Dr. Okonkwo", roleEn: "Ask this doctor before skipping morning medicine", roleAr: "اسألوه قبل إيقاف دواء الصباح", phone: null, email: null },
      ],
      caveatEn: CAVEAT_EN,
      caveatAr: CAVEAT_AR,
    },
    replies: {
      acknowledge: {
        en: "Hello,\n\nI will be at Lab Desk B on Tuesday, November 24 at 8:10 a.m. for the fasting blood test. I will bring a photo ID and my insurance card.\n\n[your name]",
        ar: "السلام عليكم،\n\nسأكون في مكتب المختبر ب يوم الثلاثاء ٢٤ نوفمبر الساعة ٨:١٠ صباحاً لتحليل الدم الصائم. سأحضر هوية وبطاقة التأمين.\n\n[اسمكم]",
      },
      question: {
        en: "Hello,\n\nI have a fasting blood test on Tuesday, November 24 at 8:10 a.m. The note says water is allowed and to take my usual morning medicines unless Dr. Okonkwo said otherwise. May I confirm that water is allowed until 8:10, and that I should take those medicines?\n\n[your name]",
        ar: "السلام عليكم،\n\nلدي تحليل دم صائم يوم الثلاثاء ٢٤ نوفمبر الساعة ٨:١٠. الرسالة تقول إن الماء مسموح، وإنني آخذ أدوية الصباح المعتادة إلا إذا أوصى الدكتور أوكونكو بغير ذلك. هل الماء مسموح حتى الساعة ٨:١٠، وهل آخذ تلك الأدوية؟\n\n[اسمكم]",
      },
      decline: {
        en: "Hello,\n\nI cannot attend the 8:10 a.m. blood test on Tuesday, November 24. Please tell me how to reschedule before Monday at 4 p.m. so I can avoid the $25 fee.\n\n[your name]",
        ar: "السلام عليكم،\n\nلا أستطيع حضور تحليل الساعة ٨:١٠ صباح الثلاثاء ٢٤ نوفمبر. أرجو إخباري كيف أغيّر الموعد قبل الاثنين الساعة ٤ حتى أتجنب رسم ٢٥ دولاراً.\n\n[اسمكم]",
      },
    },
  },
  {
    id: "maintenance",
    match: (text) => text.includes("سخان الماء"),
    text: `السلام عليكم،

هذا تذكير من مكتب العمارة. صيانة سخان الماء في الشقة ٤ب ستكون يوم الخميس ٢٦ نوفمبر بين الساعة ١٠ صباحاً و١٢ ظهراً. نرجو أن يكون شخص بالغ في البيت، أو أن تتركوا مفتاحاً عند الحارس.

رسوم الزيارة ١٢ دولاراً تُضاف إلى فاتورة ديسمبر. إذا كان الموعد غير مناسب، راسلونا قبل يوم الأربعاء على الرقم ٥٥٥-٠١٩-٤٤١٢.

شكراً لكم،
مكتب سيدار كورت`,
    reading: {
      sourceLanguage: "Arabic",
      summaryEn:
        "The building office will service the water heater in apartment 4B on Thursday, November 26, between 10:00 a.m. and 12:00 p.m. An adult should be home, or a key left with the guard. A $12 visit fee is added to the December bill. To change the time, contact the office before Wednesday at 555-019-4412.",
      summaryAr:
        "مكتب العمارة سيصون سخان الماء في الشقة ٤ب يوم الخميس ٢٦ نوفمبر بين الساعة ١٠ صباحاً و١٢ ظهراً. المطلوب وجود شخص بالغ في البيت، أو ترك المفتاح عند الحارس. رسم الزيارة ١٢ دولاراً يُضاف إلى فاتورة ديسمبر. لتغيير الموعد، راسلوا المكتب قبل يوم الأربعاء على الرقم ٥٥٥-٠١٩-٤٤١٢.",
      whatToDoEn: "Have an adult home on Thursday morning, or leave a key, unless you write to change the time before Wednesday.",
      whatToDoAr: "ليكن شخص بالغ في البيت صباح الخميس، أو اتركوا المفتاح، إلا إذا راسلتم المكتب قبل الأربعاء لتغيير الموعد.",
      actions: [
        { id: "a1", textEn: "Have an adult at home, or leave a key with the guard.", textAr: "ليكن شخص بالغ في البيت، أو اتركوا المفتاح عند الحارس.", due: "Thursday, November 26, 10:00 a.m.–12:00 p.m." },
        { id: "a2", textEn: "Expect a $12 fee on the December bill.", textAr: "توقعوا رسماً قدره ١٢ دولاراً في فاتورة ديسمبر.", due: "December bill" },
        { id: "a3", textEn: "Message the office before Wednesday if the time does not work.", textAr: "راسلوا المكتب قبل الأربعاء إذا كان الموعد غير مناسب.", due: "Before Wednesday" },
      ],
      dates: [{ labelEn: "Water-heater visit", labelAr: "زيارة صيانة السخان", value: "Thursday, November 26, 10:00 a.m.–12:00 p.m." }],
      amounts: [{ labelEn: "Visit fee", labelAr: "رسم الزيارة", value: "$12 on the December bill" }],
      contacts: [{ name: "Cedar Court office", roleEn: "Building office", roleAr: "مكتب العمارة", phone: "555-019-4412", email: null }],
      caveatEn: CAVEAT_EN,
      caveatAr: CAVEAT_AR,
    },
    replies: {
      acknowledge: {
        en: "Hello,\n\nAn adult will be home in apartment 4B on Thursday, November 26, between 10:00 a.m. and 12:00 p.m. for the water-heater visit.\n\n[your name]",
        ar: "السلام عليكم،\n\nسيكون شخص بالغ في الشقة ٤ب يوم الخميس ٢٦ نوفمبر بين الساعة ١٠ و١٢ لصيانة سخان الماء.\n\n[اسمكم]",
      },
      question: {
        en: "Hello,\n\nThank you for the note about the water heater in apartment 4B on Thursday, November 26. If no adult can be home, is leaving the key with the guard enough, and is the $12 fee still added?\n\n[your name]",
        ar: "السلام عليكم،\n\nشكراً لكم على رسالة صيانة سخان الشقة ٤ب يوم الخميس ٢٦ نوفمبر. إذا لم يوجد شخص بالغ في البيت، هل يكفي ترك المفتاح عند الحارس؟ وهل يُضاف رسم ١٢ دولاراً في هذه الحالة؟\n\n[اسمكم]",
      },
      decline: {
        en: "Hello,\n\nThursday, November 26, between 10 and 12 does not work for apartment 4B. Please offer another time. I am writing before Wednesday, as you asked.\n\n[your name]",
        ar: "السلام عليكم،\n\nموعد الخميس ٢٦ نوفمبر بين ١٠ و١٢ غير مناسب للشقة ٤ب. أرجو اقتراح وقت آخر. أراسلكم قبل يوم الأربعاء كما طلبتم.\n\n[اسمكم]",
      },
    },
  },
];

export function matchSample(text: string): SampleDocument | null {
  return samples.find((sample) => sample.match(text)) ?? null;
}

export function readingFromSample(sample: SampleDocument, intent: ReplyIntent, allowArabic: boolean): Reading {
  const reply = sample.replies[intent];
  const reading: Reading = {
    ...sample.reading,
    actions: sample.reading.actions.map((item) => ({ ...item, textAr: allowArabic ? item.textAr : null })),
    dates: sample.reading.dates.map((item) => ({ ...item, labelAr: allowArabic ? item.labelAr : null })),
    amounts: sample.reading.amounts.map((item) => ({ ...item, labelAr: allowArabic ? item.labelAr : null })),
    contacts: sample.reading.contacts.map((item) => ({ ...item, roleAr: allowArabic ? item.roleAr : null })),
    summaryAr: allowArabic ? sample.reading.summaryAr : null,
    whatToDoAr: allowArabic ? sample.reading.whatToDoAr : null,
    caveatAr: allowArabic ? sample.reading.caveatAr : null,
    replyEn: reply.en,
    replyAr: allowArabic ? reply.ar : null,
  };
  return reading;
}
