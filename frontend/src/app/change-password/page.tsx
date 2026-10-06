import { ChangePasswordFormClient } from "./ChangePasswordFormClient";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Change Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You must change your password before continuing.
          </p>
        </div>
        <ChangePasswordFormClient />
      </div>
    </div>
  );
}
