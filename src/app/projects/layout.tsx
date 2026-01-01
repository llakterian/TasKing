import { AppLayout } from "@/components/app-layout";
import { Footer } from "@/components/footer";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
        <Footer />
      </div>
    </AppLayout>
  );
}