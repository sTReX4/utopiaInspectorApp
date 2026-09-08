/*
 * Public surfaces: sign in and the legal documents. No shell, no sidebar, no
 * fixed-position escape hatch. These pages simply own the full viewport.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-[100dvh] bg-canvas">{children}</div>;
}
