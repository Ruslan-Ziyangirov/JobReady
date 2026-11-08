import type { Metadata } from "next";
import { SetupForm } from "@/components/interview/setup-form";
import { PageHeader } from "@/components/ui/page-header";
import type { GoalId } from "@/lib/types";

export const metadata: Metadata = { title: "Настройка интервью" };

const GOALS: GoalId[] = ["first-interview", "check-knowledge", "interview-review", "target-vacancy"];

export default async function InterviewSetupPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const { goal } = await searchParams;
  return (
    <>
      <PageHeader
        title="Настрой интервью"
        subtitle="Ответь на несколько вопросов, чтобы AI подобрал подходящие вопросы"
      />
      <SetupForm goal={GOALS.find((g) => g === goal)} />
    </>
  );
}
