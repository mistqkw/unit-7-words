export const SECTIONS = [
  { id: 'v71', label: '7.1 Vocabulary', short: '7.1' },
  { id: 'g72', label: '7.2 Grammar', short: '7.2' },
  { id: 'l73', label: '7.3 Listening', short: '7.3' },
  { id: 'wf', label: 'Word families', short: 'WF' },
];

const RAW = {
  v71: [
    ["baker's", 'piekarnia'],
    ['bank', 'bank'],
    ['be worth it', 'być tego wartym'],
    ['brand (n, adj)', 'marka, markowy'],
    ["butcher's", 'sklep mięsny'],
    ['cashier', 'kasjer'],
    ['charity shop', 'sklep z używanymi rzeczami prowadzony przez organizację charytatywną'],
    ["chemist's", 'drogeria, apteka'],
    ['clothes shop', 'sklep odzieżowy'],
    ['computer shop', 'sklep komputerowy'],
    ['cotton', 'bawełna'],
    ['denim', 'dżins'],
    ['department store', 'dom towarowy'],
    ['designer clothes', 'odzież od znanego projektanta'],
    ['DIY store', 'market budowlany'],
    ["estate agent's", 'biuro pośrednika w handlu nieruchomościami'],
    ['fit', 'pasować, być w odpowiednim rozmiarze'],
    ["florist's", 'kwiaciarnia'],
    ['get a refund', 'dostać zwrot pieniędzy'],
    ['go shopping', 'pójść na zakupy (dla przyjemności)'],
    ['go window shopping', 'oglądać wystawy sklepowe'],
    ["greengrocer's", 'warzywniak'],
    ["hairdresser's", 'salon fryzjerski'],
    ['have a sale', 'urządzać wyprzedaż'],
    ['health centre', 'ośrodek zdrowia'],
    ['high street store', 'sklep przy głównej ulicy miasta'],
    ["jeweller's", 'jubiler'],
    ['keep the receipt', 'zachować paragon'],
    ['last for ages', 'być nie do zdarcia'],
    ['leather (n, adj)', 'skóra; skórzany'],
    ['look fashionable', 'wyglądać modnie'],
    ['look good', 'wyglądać dobrze'],
    ['look gorgeous', 'wyglądać olśniewająco'],
    ['look original', 'wyglądać oryginalnie'],
    ['look scruffy', 'wyglądać niechlujnie'],
    ['look smart', 'wyglądać elegancko'],
    ["newsagent's", 'kiosk z gazetami'],
    ['on (special) offer', 'w ofercie (specjalnej)'],
    ["optician's", 'salon optyczny'],
    ['pet shop', 'sklep zoologiczny'],
    ['pick up a bargain', 'złowić okazję'],
    ['post office', 'poczta'],
    ['quality', 'jakość'],
    ['shoe shop', 'sklep obuwniczy'],
    ['shop online', 'robić zakupy przez internet'],
    ['silk (n, adj)', 'jedwab; jedwabny'],
    ['sports shop', 'sklep sportowy'],
    ["stationer's", 'sklep papierniczy'],
    ['store', 'sklep'],
    ['suit', 'pasować, dobrze wyglądać na'],
    ['supermarket', 'supermarket'],
    ['toy shop', 'sklep z zabawkami'],
    ['vintage shop', 'sklep z ubraniami z poprzedniej epoki'],
    ['wool', 'wełna'],
  ],
  g72: [
    ['approximately', 'w przybliżeniu, około'],
    ['crops', 'plony'],
    ['do the shopping', 'iść na zakupy'],
    ['drinking water', 'woda pitna'],
    ['make a living', 'zarobić na życie, utrzymać się'],
    ['plant', 'roślina'],
    ['protect the environment', 'chronić środowisko'],
    ['set up', 'założyć'],
  ],
  l73: [
    ['aisle', 'przejście (w samolocie, pociągu, teatrze)'],
    ['be a matter of sth / a question of sth', 'być kwestią czegoś'],
    ['be capable of doing sth', 'być zdolnym do zrobienia czegoś'],
    ['be in debt', 'mieć dług, być zadłużonym'],
    ['cheer up', 'pocieszyć'],
    ['debt', 'dług'],
    ['debtor', 'dłużnik'],
    ['earn', 'zarabiać'],
    ['earner', 'osoba zarabiająca'],
    ['earnings', 'zarobki'],
    ['face cream', 'krem do twarzy'],
    ['friendship bracelet', 'bransoletka przyjaźni'],
    ['invest in', 'zainwestować w'],
    ['investment', 'inwestycja'],
    ['investor', 'inwestor'],
    ['make sb feel happier', 'uszczęśliwić kogoś'],
    ['pay', 'płacić'],
    ['payer', 'płatnik'],
    ['payment', 'płatność'],
    ['perfume', 'perfumy'],
    ['produce', 'produkować'],
    ['producer', 'producent'],
    ['product', 'produkt'],
    ['purse', 'portmonetka'],
    ['recording studio', 'studio nagraniowe'],
    ['sale', 'sprzedaż'],
    ['sell', 'sprzedawać'],
    ['seller', 'sprzedający'],
    ['toilets', 'toalety'],
    ['trade (n, v)', 'handel; handlować'],
    ['trader', 'handlarz'],
    ['value', 'wartość'],
  ],
  wf: [
    ['earn', 'earn / earner / earnings'],
    ['pay', 'pay / payer / payment'],
    ['invest', 'invest / investment / investor'],
    ['produce', 'produce / producer / product'],
    ['sell', 'sell / seller / sale'],
    ['trade', 'trade / trader'],
    ['debt', 'debt / debtor / be in debt'],
    ['shop', 'shop / go shopping / do the shopping / shop online'],
  ],
};

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const WORDS = Object.entries(RAW).flatMap(([section, rows]) =>
  rows.map(([en, pl], i) => ({
    id: `${section}-${i}-${slug(en)}`,
    section,
    en,
    pl,
    isFamily: section === 'wf',
  }))
);

export const WORDS_BY_SECTION = SECTIONS.map((s) => ({
  ...s,
  total: WORDS.filter((w) => w.section === s.id).length,
}));

export const GRAMMAR = [
  {
    title: 'Покупки: три устойчивых выражения',
    rules: [
      'do the shopping / go shopping = идти за покупками.',
      'go window shopping = просто смотреть витрины.',
      'have a sale = устраивать распродажу.',
    ],
    examples: ['I do the shopping on Saturdays.', 'We went window shopping after school.', 'The store has a sale this weekend.'],
  },
  {
    title: 'Деньги: устойчивые выражения',
    rules: [
      'make a living = зарабатывать на жизнь.',
      'be in debt = быть в долгу.',
      'get a refund = получить возврат.',
      'keep the receipt = сохранить чек.',
    ],
    examples: ['She makes a living as a baker.', 'He is in debt again.', 'You can get a refund with the receipt.'],
  },
  {
    title: 'look + прилагательное',
    rules: [
      'После look идёт прилагательное: look smart, scruffy, fashionable, gorgeous, original, good.',
      'look = «выглядеть», а не «смотреть»: You look smart today.',
    ],
    examples: ['You look smart today.', 'That jacket looks scruffy.', 'The shop window looks gorgeous.'],
  },
  {
    title: 'fit vs suit',
    rules: [
      'fit = по размеру. The jeans fit me.',
      'suit = идёт, подходит по стилю или цвету. That colour suits you.',
      'В карточках оба переводятся «пасовать», но смысл разный — смотри на контекст.',
    ],
    examples: ['These shoes fit me perfectly.', 'That colour suits you.'],
  },
  {
    title: 'Word families',
    rules: [
      'Глагол → человек → вещь или процесс: earn → earner → earnings, invest → investor → investment.',
      'В задании часто дают одно слово и просят другую форму. Смотри на место в предложении.',
      'После a / an нужно существительное-человек: an investor, a producer, a trader.',
      'В конце за глаголом часто существительное-процесс: the investment, the payment, the earnings.',
    ],
    examples: ['He is a successful investor.', 'The payment arrived on time.', 'Her earnings grew last year.'],
  },
  {
    title: "Магазины с 's",
    rules: [
      "Притяжательная форма с 's: baker's, chemist's, florist's, greengrocer's, butcher's.",
      "Ещё: hairdresser's, jeweller's, newsagent's, optician's, stationer's, estate agent's.",
      "В таких названиях 's не значит «чей-то» — это просто название магазина.",
    ],
    examples: ["I'm going to the baker's.", 'The chemist\u2019s is closed today.', "She works at the florist's."],
  },
];
