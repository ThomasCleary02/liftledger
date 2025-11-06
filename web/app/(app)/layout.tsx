import { Navigation } from "../../components/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="pb-16 md:ml-64">
        {children}
      </div>
    </>
  );
}
