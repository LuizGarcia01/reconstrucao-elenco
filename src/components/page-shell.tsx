export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10">{children}</div>;
}
