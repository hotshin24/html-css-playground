import LearningScreen from "@/components/sources/LearningScreen";

export default async function LearnPage({ params }: PageProps<"/sources/[id]/learn">) {
  const { id } = await params;
  return <LearningScreen sourceId={id} />;
}
