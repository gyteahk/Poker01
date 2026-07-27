export type WikiLocaleText = { zh: string; en: string };

export type WikiSection = {
  heading: WikiLocaleText;
  paragraphs: WikiLocaleText[];
};

export type WikiArticle = {
  slug: string;
  /** SEO-focused titles */
  title: WikiLocaleText;
  description: WikiLocaleText;
  /** Short card blurb on /wiki hub */
  teaser: WikiLocaleText;
  updatedAt: string;
  related: string[];
  sections: WikiSection[];
};

export const wikiArticles: WikiArticle[] = [
  {
    slug: "texas-holdem-rules",
    title: {
      zh: "德州撲克規則新手入門：一局點樣打完",
      en: "Texas Hold'em rules for beginners: how one hand works",
    },
    description: {
      zh: "用香港玩家易明嘅方式講清德州撲克規則：盲注、翻牌前到河牌、邊個贏池。適合完全新手。",
      en: "Clear Texas Hold'em rules for beginners: blinds, streets, and who wins the pot.",
    },
    teaser: {
      zh: "完全新手必讀：由發牌到攤牌，一局德州撲克點運作。",
      en: "From deal to showdown — how a Hold'em hand actually runs.",
    },
    updatedAt: "2026-07-27",
    related: ["hand-rankings", "blinds", "mtt-beginner"],
    sections: [
      {
        heading: { zh: "德州撲克係咩？", en: "What is Texas Hold'em?" },
        paragraphs: [
          {
            zh: "德州撲克（Texas Hold'em）係而家最主流嘅撲克玩法。每家會收到兩張底牌（hole cards），再同最多五張公共牌組成最佳五張牌型。目標唔只係「有最大牌」，而係喺資訊唔完整之下，做出長期有期望值嘅決定——跟、加、棄都可能啱。",
            en: "Texas Hold'em is the most widely played poker variant. Everyone gets two hole cards and shares up to five community cards to make a five-card hand. The goal is not only the best hand — it is making +EV decisions with incomplete information.",
          },
        ],
      },
      {
        heading: { zh: "一局嘅基本流程", en: "The flow of one hand" },
        paragraphs: [
          {
            zh: "開局先有盲注：通常係小盲（SB）同大盲（BB）強制落注，令每手都有底池。之後由大盲左手邊開始行動：棄牌（fold）、跟注（call）或加注（raise）。翻牌前結束後，荷官會開三張翻牌（flop），再有一輪下注；之後轉牌（turn）、河牌（river）各一張，各跟一輪下注。若到最後仍有多於一人，就攤牌比牌型。",
            en: "Blinds start the pot (small blind and big blind). Action begins left of the big blind: fold, call, or raise. After preflop, the flop (three cards), turn, and river each get a betting round. If more than one player remains, hands are shown at showdown.",
          },
          {
            zh: "新手最易亂嘅位：唔係記住所有術語，而係搞清楚「而家係邊一街、邊個先行動、跟注要畀幾多」。搞清節奏，先至談範圍同詐唬。",
            en: "Beginners get lost less on jargon and more on street, who acts, and how much to call. Learn the rhythm before ranges and bluffs.",
          },
        ],
      },
      {
        heading: { zh: "新手第一週建議", en: "First-week beginner tips" },
        paragraphs: [
          {
            zh: "先用低買入練習，唔好急住學複雜線。起手牌由緊（premium）開始：高對、AK 等；位置越後可稍為放寬。每手問自己：若棄牌，我會唔會後悔到影響下一手？若會，可能你太情緒化。想練習決策，可去今日決策同迷你遊戲；想補詞彙，可睇手牌排名同盲注結構長文。",
            en: "Start at low stakes. Play tight premiums early; loosen a bit in later position. Ask whether a fold would tilt your next hand — that is emotion talking. Practice on Daily Decision and mini-games; learn rankings and blinds next.",
          },
        ],
      },
    ],
  },
  {
    slug: "hand-rankings",
    title: {
      zh: "德州撲克手牌排名：由高牌到皇家同花順",
      en: "Poker hand rankings: from high card to royal flush",
    },
    description: {
      zh: "完整德州撲克牌型大小：皇家同花順、同花順、四條、葫蘆、同花、順子、三條、兩對、一對、高牌。",
      en: "Complete Hold'em hand rankings from royal flush down to high card.",
    },
    teaser: {
      zh: "攤牌前必備：邊啲牌型大過邊啲。",
      en: "Must-know ranking before every showdown.",
    },
    updatedAt: "2026-07-27",
    related: ["texas-holdem-rules", "pot-odds", "mtt-beginner"],
    sections: [
      {
        heading: { zh: "點解要背排名？", en: "Why rankings matter" },
        paragraphs: [
          {
            zh: "攤牌時邊個贏池，完全由五張最佳牌型決定。公共牌會「共享」，所以有時你同對手用同一組公共牌組成類似牌型，要比 kickers（邊牌）。新手應先倒背排名，再學邊啲板面容易出現同花／順子危險。",
            en: "Showdowns are won by the best five-card hand. Shared boards mean kickers often decide. Memorize the ladder first, then learn wet boards that make flushes and straights.",
          },
        ],
      },
      {
        heading: { zh: "由大至小", en: "Highest to lowest" },
        paragraphs: [
          {
            zh: "1）皇家同花順：同花 A-K-Q-J-10。2）同花順：同花連續五張。3）四條：四張同點。4）葫蘆（滿堂紅）：三條加一對。5）同花：五張同花色。6）順子：連續五張（花色可不同）。7）三條。8）兩對。9）一對。10）高牌。A 可以做順子最大或 A-2-3-4-5 最小輪（wheel）。",
            en: "1) Royal flush 2) Straight flush 3) Quads 4) Full house 5) Flush 6) Straight 7) Trips 8) Two pair 9) Pair 10) High card. Ace plays high in broadway straights and low in the wheel.",
          },
        ],
      },
      {
        heading: { zh: "實戰提醒", en: "Practical reminder" },
        paragraphs: [
          {
            zh: "「我有對 A」唔等於一定大——板上若有同花或順子可能，你可能已落後。下注前先問：邊啲牌型會贏我？想練感覺，可玩記憶同測驗小遊戲；想知跟注值唔值，讀底池賠率。",
            en: "Top pair is not always enough on wet boards. Ask which hands beat you. Train with mini-games; use pot odds when deciding calls.",
          },
        ],
      },
    ],
  },
  {
    slug: "blinds",
    title: {
      zh: "撲克盲注結構係咩？現金桌同 MTT 分別",
      en: "Poker blind structure: cash games vs MTT",
    },
    description: {
      zh: "解釋小盲、大盲、盲注結構點影響節奏；現金桌固定盲注同 MTT 升盲有何不同，新手點選桌。",
      en: "Small blind, big blind, and how structures change cash vs tournament pace.",
    },
    teaser: {
      zh: "搞清 SB／BB 同升盲，先至唔會坐錯桌。",
      en: "Know SB/BB and levels before you sit.",
    },
    updatedAt: "2026-07-27",
    related: ["texas-holdem-rules", "mtt-beginner", "bankroll"],
    sections: [
      {
        heading: { zh: "盲注做咩用？", en: "What blinds do" },
        paragraphs: [
          {
            zh: "盲注係翻牌前強制注，令每手都有底池，避免人人一直等神牌。通常座位會輪流做小盲同大盲。大盲係完整強制單位；小盲多數係一半。有 ante 嘅局（常見於比賽）會再令底池更大、偷盲更有價值。",
            en: "Blinds force money in so pots form every hand. Seats rotate SB/BB. Antes (common in tournaments) inflate pots and increase steal value.",
          },
        ],
      },
      {
        heading: { zh: "現金桌 vs 比賽結構", en: "Cash vs tournament structure" },
        paragraphs: [
          {
            zh: "現金桌盲注通常固定，你可以隨時離桌，深度（stack 相對盲注）較穩定，適合練習單一決策。MTT／Sit & Go 會定時升盲，平均籌碼深度愈嚟愈淺，後期被迫打得更緊湊同更注重位置。選錯結構＝壓力同決策類型完全不同。",
            en: "Cash blinds are usually fixed and you can leave anytime — good for isolated decisions. MTTs rise on a schedule and stacks shrink, forcing tighter late-game and position play.",
          },
          {
            zh: "新手建議：先喺低盲現金桌搞清規則同位置，再試慢速升盲嘅低買入 MTT。升盲太快嘅衛星賽或超高速場，學習效率通常較差。",
            en: "Learn rules and position in low cash first, then slow-structure low buy-in MTTs. Hyper-turbos teach panic more than skill.",
          },
        ],
      },
    ],
  },
  {
    slug: "pot-odds",
    title: {
      zh: "底池賠率係咩？撲克跟注點計",
      en: "What are pot odds? How to price a call",
    },
    description: {
      zh: "用淺白例子講底池賠率（pot odds）：比較跟注成本同底池，判斷跟注長線值唔值，仲提到 equity 概念。",
      en: "Pot odds explained with simple examples: call cost vs pot, and how equity fits in.",
    },
    teaser: {
      zh: "唔再憑感覺跟注：用底池賠率估值唔值。",
      en: "Stop calling by feel — price the pot.",
    },
    updatedAt: "2026-07-27",
    related: ["texas-holdem-rules", "tilt", "hand-rankings"],
    sections: [
      {
        heading: { zh: "一句講清", en: "In one line" },
        paragraphs: [
          {
            zh: "底池賠率＝你要付出幾多，去贏而家個池（加對手上嚟嘅注）。若你「贏嘅機會」長期高過呢個代價比例，跟注先有數學根據。",
            en: "Pot odds compare what you must put in to what you can win. If your chance to win exceeds that price long-term, the call is mathematically justified.",
          },
        ],
      },
      {
        heading: { zh: "簡易例子", en: "Quick example" },
        paragraphs: [
          {
            zh: "底池已經有 $90，對手再下注 $10，你要跟 $10 去贏總共 $100。你付出 10，可能贏得 100，代價比例大約 10%。若你估計自己大約有 20% 機會贏到攤牌（例如聽同花），呢個跟注就偏正。若只有 5% 機會，就應傾向棄牌。",
            en: "Pot is $90, villain bets $10; you call $10 to win $100 total — about 10% price. If you truly have ~20% equity, calling is fine; at ~5%, folding is better.",
          },
          {
            zh: "實戰你唔會次次精確計，但要建立感覺：池愈大、對手注愈細，跟注要求嘅勝率愈低；對手注愈大，你就要有更強牌或更多 outs。",
            en: "You will not compute every street exactly, but build intuition: bigger pot / smaller bet needs less equity; bigger bets demand stronger hands or more outs.",
          },
        ],
      },
      {
        heading: { zh: "常見陷阱", en: "Common traps" },
        paragraphs: [
          {
            zh: "只計底池賠率唔夠：仲要諗後面仲有冇更大注（implied／reverse implied odds），同對手範圍係咪真係畀你聽牌。輸一手之後「跟住睇河」好多時係 Tilt，唔係賠率。可用今日決策練習唔情緒化選擇。",
            en: "Pot odds alone ignore future bets and range reality. Calling “to see the river” after a bad beat is often tilt, not math. Train calm choices on Daily Decision.",
          },
        ],
      },
    ],
  },
  {
    slug: "tilt",
    title: {
      zh: "撲克心態同 Tilt：點樣唔畀情緒毀決策",
      en: "Poker mindset and tilt: protect your decisions",
    },
    description: {
      zh: "講解撲克心態、Tilt 常見徵兆、stop-loss 同離桌方法，幫你喺波動之下保持決策質素。",
      en: "Poker mindset, tilt signs, stop-loss and reset habits so variance does not wreck your process.",
    },
    teaser: {
      zh: "輸一手唔等於輸成晚：先處理情緒，再返牌桌。",
      en: "One hand is not the session — reset before you re-enter.",
    },
    updatedAt: "2026-07-27",
    related: ["bankroll", "pot-odds", "mtt-beginner"],
    sections: [
      {
        heading: { zh: "Tilt 係咩？", en: "What tilt is" },
        paragraphs: [
          {
            zh: "Tilt 係情緒接管決策：最常見係被壞牌（bad beat）之後想「即刻贏返」。表現包括：擴大範圍、無謂跟注、同某一對手私人恩怨、突然加長 session。技術冇消失，係執行被情緒劫持。",
            en: "Tilt is emotion driving clicks: usually “win it back now” after a bad beat. Looser calls, revenge pots, and marathon sessions are common. Skill remains; execution collapses.",
          },
        ],
      },
      {
        heading: { zh: "可執行對策", en: "Practical fixes" },
        paragraphs: [
          {
            zh: "事前設好：單日止蝕、單 session 時長、最多幾次 reload。事中：輸大手後強制離桌兩分鐘、喝水、重溫「只打預先決定範圍」。事後：複盤問過程啱唔啱，唔好只問輸贏。撲克心態嘅核心係接受 variance——短期結果可以同正確決策脫鈎。",
            en: "Set stop-loss, time caps, and reload limits before you play. After a cooler, take two minutes away and return only to pre-planned ranges. Review process, not just results. Mindset means accepting variance.",
          },
          {
            zh: "想訓練「冷靜選擇」，每日返今日決策；想減少金錢壓力對心態嘅扭曲，讀資金管理。長期進步黎自可重複流程，唔係單晚手氣。",
            en: "Train calm choices on Daily Decision; reduce money-pressure with bankroll discipline. Long-run edge is repeatable process, not one lucky night.",
          },
        ],
      },
    ],
  },
  {
    slug: "bankroll",
    title: {
      zh: "撲克資金管理：買入同風險點控",
      en: "Poker bankroll management: buy-ins and risk",
    },
    description: {
      zh: "新手撲克資金管理入門：點解買入唔好太大、點樣用籌碼緩衝保護心態同決策。",
      en: "Beginner bankroll basics: why oversized buy-ins warp decisions and how cushion protects mindset.",
    },
    teaser: {
      zh: "錢唔夠＝心態唔穩；先保護彈藥。",
      en: "Short money creates short tempers — protect the ammo.",
    },
    updatedAt: "2026-07-27",
    related: ["tilt", "blinds", "mtt-beginner"],
    sections: [
      {
        heading: { zh: "點解銀行滾存重要", en: "Why bankroll matters" },
        paragraphs: [
          {
            zh: "買入相對你總資金太大，每一個決定都會被「唔敢輸」扭曲：該棄唔敢棄、該 value 唔敢打。資金管理唔係怯場，而係令你嘅技術有空間發揮。",
            en: "Oversized buy-ins warp folds and value bets through fear. Bankroll management is not cowardice — it is room for your skill to show up.",
          },
        ],
      },
      {
        heading: { zh: "新手實用框架", en: "A simple beginner frame" },
        paragraphs: [
          {
            zh: "用「娛樂／學習資金」同「生活費」分開。學習期選你輸光都唔影響生活嘅級別。現金桌可想像保留多手買入作緩衝；比賽則接受更高波動，買入佔總娛樂資金嘅比例要更細。升級靠樣本同穩定 win rate 感覺，唔靠單週大贏。",
            en: "Separate play money from living costs. Pick stakes you can lose without lifestyle damage. Cash needs multiple buy-in cushions; tournaments need smaller % per shot. Move up on samples, not one heater week.",
          },
        ],
      },
    ],
  },
  {
    slug: "mtt-beginner",
    title: {
      zh: "MTT 錦標賽入門：新手第一場點打",
      en: "MTT tournament basics for your first flight",
    },
    description: {
      zh: "MTT 入門教學：起始籌碼、升盲、早中後期重點，同新手常見錯誤，幫你打完第一場有結構嘅錦標賽。",
      en: "First MTT guide: starting stacks, levels, early-mid-late focus, and common beginner mistakes.",
    },
    teaser: {
      zh: "第一場 MTT 唔好追大獎：先搞結構再求生存。",
      en: "Skip the jackpot chase — learn structure and survival first.",
    },
    updatedAt: "2026-07-27",
    related: ["blinds", "texas-holdem-rules", "tilt"],
    sections: [
      {
        heading: { zh: "MTT 同現金桌差喺邊", en: "How MTT differs from cash" },
        paragraphs: [
          {
            zh: "MTT（Multi-Table Tournament）大家買入固定，籌碼冇金可再買（Freezeout）或有限 re-entry。盲注會升，目標係生存同累積籌碼，最終短桌爭獎。你唔可以「輸完上碼再來」咁輕鬆，所以每手風險管理同位置更關鍵。",
            en: "MTTs have fixed buy-ins and rising blinds. You cannot casually reload like cash. Survival, stack growth, and position matter more as the field shrinks toward the money.",
          },
        ],
      },
      {
        heading: { zh: "早中後期重點", en: "Early, middle, late focus" },
        paragraphs: [
          {
            zh: "早期：深度尚可，避免無謂 all-in，打相對穩陣範圍。中期：注意 M 值（籌碼相對盲注 ante），位置偷盲價值上升。後期／泡沫：獎額結構會影響風險；唔好只抄別人 all-in 頻率。新手由低買入、較慢結構開始，打完複盤三手關鍵決定。",
            en: "Early: deep play, avoid spewy all-ins. Middle: watch M-ratio; steals rise in value. Late/bubble: payouts change risk. Start low and slow; review three key hands after.",
          },
          {
            zh: "心態上，MTT 波動好大，單場結果唔代表水平。配合資金管理同 Tilt 文章，先至打得耐。日常可用今日決策保持手感，再用時事快睇了解賽事生態。",
            en: "MTT variance is huge — one flight is not your skill. Pair bankroll and tilt habits with Daily Decision practice and news for the wider scene.",
          },
        ],
      },
    ],
  },
];

export function getWikiArticle(slug: string): WikiArticle | undefined {
  return wikiArticles.find((a) => a.slug === slug);
}

export function listWikiArticles(): WikiArticle[] {
  return wikiArticles;
}
