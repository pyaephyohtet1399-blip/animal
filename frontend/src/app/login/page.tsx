import { LoginFormClient } from "./LoginFormClient";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Livestock Census</h1>
        <p className="mt-1 text-lg font-semibold">Management System</p>
        <p className="text-sm text-muted-foreground">Meiktila District</p>
      </div>
      <LoginFormClient />
    </div>
  );
}
