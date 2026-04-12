export default function AuthCheckPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface w-full max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">Auth Check</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you can see this, authentication passed.
        </p>
      </div>
    </div>
  );
}
