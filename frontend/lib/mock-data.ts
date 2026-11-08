import type {
  ChatMessage,
  Goal,
  HistoryItem,
  InterviewResult,
  Option,
  Plan,
  PracticeResult,
  Problem,
  TopicPractice,
} from "./types";

export const user = {
  name: "Анна Смирнова",
  role: "Product Designer",
};

export const goals: Goal[] = [
  { id: "first-interview", title: "Подготовиться к первому собеседованию", illustration: "/illustrations/goal-first-interview.png" },
  { id: "check-knowledge", title: "Проверить свои знания", illustration: "/illustrations/goal-check-knowledge.png" },
  { id: "interview-review", title: "Разобрать неудачное собеседование", illustration: "/illustrations/goal-interview-review.png" },
  { id: "target-vacancy", title: "Подготовиться к конкретной вакансии", illustration: "/illustrations/goal-target-vacancy.png" },
];

export const professions: Option[] = [
  { id: "product-designer", label: "Product Designer" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "qa", label: "QA" },
  { id: "product-manager", label: "Product Manager" },
  { id: "system-analytics", label: "System Analytics" },
];

export const grades: Option[] = [
  { id: "junior", label: "Junior" },
  { id: "middle", label: "Middle" },
  { id: "senior", label: "Senior" },
  { id: "team-lead", label: "Team Lead" },
];

export const interviewTypes: Option[] = [
  { id: "hr", label: "HR-интервью" },
  { id: "tech", label: "Техническое" },
  { id: "mixed", label: "Смешанное" },
];

export const interviewQuestions = [
  "Расскажи немного о себе и почему ты решил развиваться в Product Design?",
  "Расскажи о проекте, которым ты гордишься",
  "Как ты обычно подходишь к новой продуктовой задаче, если требования ещё не до конца сформулированы?",
  "Как ты понимаешь, что дизайн-решение действительно сработало после запуска?",
  "Расскажи о ситуации, когда тебе пришлось отстаивать своё решение перед продактами или разработчиками",
];

export const aiFollowUps = [
  "А можете чуть подробнее рассказать, как шло развитие дальше?",
  "Какой результат это дало продукту? Есть ли цифры?",
  "Что именно в этом проекте делали лично вы?",
  "Понял. Переходим к следующему вопросу.",
];

export const initialChat: ChatMessage[] = [
  { id: "m1", role: "ai", text: "Привет! Начнём. " + interviewQuestions[0] },
  {
    id: "m2",
    role: "user",
    text: "В 2020 году я учился в университете и нам было дано задание — придумать свой стартап, там я впервые и прикоснулся к дизайну",
  },
  { id: "m3", role: "ai", text: aiFollowUps[0] },
];

export const interviewResult: InterviewResult = {
  overall: 7.2,
  marketAverage: 6.5,
  summary: "Хорошая база, но стоит улучшить структуру ответов и повторить несколько технических тем",
  metrics: [
    { id: "structure", label: "Структура ответа", value: 6, market: 6.8, tone: "blue" },
    { id: "logic", label: "Логика", value: 7, market: 6.4, tone: "purple" },
    { id: "confidence", label: "Уверенность", value: 4, market: 6.2, tone: "green" },
  ],
  strengths: [
    "Понимаешь базовые Design термины",
    "Умеешь объяснять ход своих мыслей",
    "Приводишь примеры из проектов",
  ],
  weaknesses: [
    "Ответы иногда слишком хаотичные",
    "Мало конкретных примеров",
    "Есть пробелы в UX Design",
  ],
  questions: [
    {
      id: "q1",
      index: 1,
      question: "Расскажи о проекте, которым ты гордишься",
      score: 5,
      whatWentWrong: "Ответ слишком общий: непонятно, какую задачу решал проект и что изменилось после запуска.",
      howToImprove: "Опиши контекст в 1–2 фразах, свою роль, ключевые решения и измеримый результат.",
    },
    {
      id: "q2",
      index: 2,
      question: "Как ты обычно подходишь к новой продуктовой задаче, если требования ещё не до конца сформулированы?",
      score: 7,
      whatWentWrong: "Хороший процесс, но не хватило примера из практики.",
      howToImprove: "Добавь короткий кейс: какие вопросы задал, какие гипотезы проверил.",
    },
    {
      id: "q3",
      index: 3,
      question: "Как ты понимаешь, что дизайн-решение действительно сработало после запуска?",
      score: 9,
      whatWentWrong: "Почти идеально — можно назвать конкретные метрики.",
      howToImprove: "Упомяни, какие продуктовые метрики отслеживал и как часто.",
    },
    {
      id: "q4",
      index: 4,
      question: "Расскажи о ситуации, когда тебе пришлось отстаивать своё решение перед продактами или разработчиками",
      score: 10,
      whatWentWrong: "Сильный ответ: есть конфликт, аргументы и итог.",
      howToImprove: "Оставь как есть — это пример хорошей структуры.",
    },
    {
      id: "q5",
      index: 5,
      question: "Как ты определяешь, какие проблемы пользователей стоит решать в первую очередь?",
      score: 6,
      whatWentWrong: "Не назван ни один фреймворк приоритизации.",
      howToImprove: "Расскажи про RICE/ICE или влияние на ключевую метрику и стоимость решения.",
    },
  ],
};

export const plan: Plan = {
  daysLeft: 3,
  previousScore: 7.2,
  marketAverage: 6.5,
  days: [
    { id: "d1", day: 1, title: "Научиться структурировать ответы" },
    { id: "d2", day: 2, title: "Разобрать технические вопросы" },
    { id: "d3", day: 3, title: "Повторное интервью" },
  ],
  topics: [
    { id: "structure", title: "Структура ответов", day: 1, status: "in-progress" },
    { id: "personal", title: "Личный вклад", day: 1, status: "in-progress" },
    { id: "tech", title: "Технические вопросы", day: 2, status: "soon" },
    { id: "retry", title: "Повторное интервью", day: 3, status: "soon" },
  ],
};

export const problems: Problem[] = [
  { id: "personal", title: "Не показываешь личный вклад", illustration: "/illustrations/problem-personal.png", done: false },
  { id: "results", title: "Не называешь результат", illustration: "/illustrations/problem-results.png", done: false },
  { id: "context", title: "Долго вводишь в контекст", illustration: "/illustrations/problem-context.png", done: false },
  { id: "specifics", title: "Не хватает конкретики", illustration: "/illustrations/problem-specifics.png", done: false },
];

export const topicPractice: TopicPractice = {
  id: "personal",
  title: "Не показываешь личный вклад",
  description: "Интервьюеру сложно понять, что сделал именно ты, если весь ответ построен через «мы».",
  yourAnswer: "Мы делали редизайн онбординга, провели исследования и изменили несколько экранов.",
  strongerAnswer:
    "«Я отвечал за редизайн онбординга. Проанализировал точки отвалов, провёл 5 пользовательских интервью и на основе результатов переработал первые три шага сценария.»",
  retryHints: [
    "за какую часть отвечал именно ты;",
    "какие решения принимал;",
    "что делала команда, а что — ты;",
    "какой вклад внёс в итоговый результат.",
  ],
};

export const practiceResult: PracticeResult = {
  before: 5,
  after: 9,
  previouslyGood: ["Понятен твой личный вклад", "Добавлены конкретные действия", "Приводишь примеры из проектов"],
  improved: ["Ответы стали более структурированными", "Точечно объясняешь результат"],
  notImproved: ["Умеешь объяснять ход своих мыслей"],
};

export const history: HistoryItem[] = [
  { id: "h1", date: "27 октября", title: "Пробное интервью · Product Designer · Middle", score: 7.2 },
  { id: "h2", date: "25 октября", title: "Проработка темы · Личный вклад", score: 9 },
  { id: "h3", date: "20 октября", title: "Диагностическое интервью · Product Designer", score: 6.1 },
];
