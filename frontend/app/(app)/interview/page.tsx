import type { Metadata } from "next";
import { InterviewRoom } from "@/components/interview/interview-room";

export const metadata: Metadata = { title: "Пробное интервью" };

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <InterviewRoom key={id} id={id} />;
}
