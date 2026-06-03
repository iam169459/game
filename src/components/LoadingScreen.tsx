export function LoadingScreen() {
  return (
    <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="relative">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-border border-t-accent" />
        <div className="absolute inset-0 flex items-center justify-center text-lg">📱</div>
      </div>
      <div className="text-center">
        <p className="text-gradient text-lg font-bold">Devices Tycoon</p>
        <p className="mt-1 text-sm text-muted">Booting your empire…</p>
      </div>
    </div>
  );
}
