import { LoginFormClient } from "./LoginFormClient";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">တိရစ္ဆာန်ကောက်ယူရေး</h1>
        <p className="mt-1 text-lg font-semibold">စီမံခန့်ခွဲမှုစနစ်</p>
        <p className="text-sm text-muted-foreground">မိတ္ထီလာခရိုင်</p>
      </div>
      <LoginFormClient />
    </div>
  );
}