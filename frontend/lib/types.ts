// Типы домена. Совпадают с будущими Pydantic-схемами FastAPI —
// при подключении бэкенда меняется только lib/api.ts.

export type GoalId = "first-interview" | "check-knowledge" | "interview-review" | "target-vacancy";

export type Goal = {
  id: GoalId;
  title: string;
  illustration: string;
};

export type Option = { id: string; label: string };

export type InterviewSetup = {
  profession: string;
  grade: string;
  type: string;
};

export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

export type ScoreTone = "orange" | "blue" | "purple" | "green";

export type Metric = {
  id: string;
  label: string;
  value: number; // 0–10
  market: number; // среднее по рынку, 0–10
  tone: ScoreTone;
};

export type QuestionReview = {
  id: string;
  index: number;
  question: string;
  score: number;
  whatWentWrong: string;
  howToImprove: string;
};

export type InterviewResult = {
  overall: number;
  marketAverage: number;
  summary: string;
  metrics: Metric[];
  strengths: string[];
  weaknesses: string[];
  questions: QuestionReview[];
};

export type PlanDay = {
  id: string;
  day: number;
  title: string;
};

export type TopicStatus = "in-progress" | "soon" | "done";

export type PlanTopic = {
  id: string;
  title: string;
  day: number;
  status: TopicStatus;
};

export type Plan = {
  daysLeft: number;
  previousScore: number;
  marketAverage: number;
  days: PlanDay[];
  topics: PlanTopic[];
};

export type Problem = {
  id: string;
  title: string;
  illustration: string;
  done: boolean;
};

export type TopicPractice = {
  id: string;
  title: string;
  description: string;
  yourAnswer: string;
  strongerAnswer: string;
  retryHints: string[];
};

export type PracticeResult = {
  before: number;
  after: number;
  previouslyGood: string[];
  improved: string[];
  notImproved: string[];
};

export type HistoryItem = {
  id: string;
  date: string;
  title: string;
  score: number;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  goal: GoalId | null;
};

export type InterviewState = {
  id: string;
  profession: string;
  grade: string;
  type: string;
  professionLabel: string;
  gradeLabel: string;
  typeLabel: string;
  status: "in-progress" | "finished";
  totalQuestions: number;
  /** Номер текущего вопроса с единицы; после завершения равен totalQuestions. */
  currentQuestion: number;
  currentQuestionText: string | null;
  messages: ChatMessage[];
};
