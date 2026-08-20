import { Navigation } from "../../components/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="app-shell md:ml-64">
        {children}
      </div>
    </>
  );
}
