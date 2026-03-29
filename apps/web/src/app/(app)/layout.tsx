export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4">
        <nav className="flex items-center gap-4">
          <span className="font-bold">Todo with Any AI</span>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
