import SectionEditor from "@/components/sections/SectionEditor";

export default async function SectionsPage({ params }: PageProps<"/sources/[id]/sections">) {
  const { id } = await params;
  return <SectionEditor sourceId={id} />;
}
