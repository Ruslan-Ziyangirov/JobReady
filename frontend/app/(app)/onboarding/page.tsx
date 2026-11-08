import type { Metadata } from "next";
import { GoalPicker } from "@/components/onboarding/goal-picker";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Цель подготовки" };

export default function OnboardingPage() {
  return (
    <>
      <PageHeader
        title="Как хочешь подготовиться?"
        subtitle="Выбери цель — JobReady настроит тренировку под твою ситуацию"
      />
      <GoalPicker />
    </>
  );
}
