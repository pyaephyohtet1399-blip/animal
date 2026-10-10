import Image from "next/image";
import { LoginFormClient } from "./LoginFormClient";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f8f5] sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-green-950/10 sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-2">
        {/* Left side: Image and system information */}
        <section className="relative hidden min-h-[600px] overflow-hidden bg-[#145c3b] lg:block">
          <Image
            src="/images/image.png"
            alt="တိရစ္ဆာန်ကောက်ယူရေး စီမံခန့်ခွဲမှုစနစ်"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />

          {/* Image overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#082d1e]/90 via-[#145c3b]/30 to-[#145c3b]/10" />

          <div className="absolute inset-x-0 bottom-0 z-10 p-10 xl:p-14">
            <div className="mb-5 h-1 w-16 rounded-full bg-[#a7e6bd]" />

            <p className="mb-3 text-sm font-medium tracking-[0.2em] text-green-100">
              ANIMAL CENSUS MANAGEMENT SYSTEM
            </p>

            <h2 className="text-3xl font-bold leading-relaxed text-white xl:text-3xl">
              တိရစ္ဆာန်ကောင်‌ရေကောက်ယူရေး
              <br />
              စီမံခန့်ခွဲမှုစနစ်
            </h2>

            <p className="mt-4 text-base text-green-50/90">
              မိတ္ထီလာခရိုင်
            </p>

            <p className="mt-8 max-w-sm text-sm leading-7 text-green-50/75">
              စီမံခန့်ခွဲမှုလုပ်ငန်းများကို လွယ်ကူစွာ
              ဆောင်ရွက်နိုင်ရန်အတွက် စနစ်အတွင်းသို့
              ဝင်ရောက်အသုံးပြုပါ။
            </p>
          </div>
        </section>

        {/* Right side: Login form */}
        <section className="flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile image */}
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-green-50 shadow-md ring-1 ring-green-100 sm:h-32 sm:w-32">
                <Image
                  src="/images/image.png"
                  alt="တိရစ္ဆာန်ကောက်ယူရေး"
                  fill
                  priority
                  sizes="128px"
                  className="object-contain p-2"
                />
              </div>
            </div>

            <div className="mb-9 text-center">
              <div className="mb-5 inline-flex items-center rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-semibold tracking-wide text-green-800">
                DISTRICT ADMINISTRATION
              </div>

              <h1 className="text-2xl font-bold leading-relaxed tracking-tight text-gray-900 sm:text-2xl">
                မိတ္ထီလာခရိုင် တိရစ္ဆာန်ကောင်ရေစာရင်း 
              </h1>

              <p className="mt-2 text-2xl font-semibold text-green-800">
                ကောက်ယူခြင်း စီမံခန့်ခွဲမှုစနစ်
              </p>


              <div className="mx-auto mt-6 h-1 w-12 rounded-full bg-green-600" />
            </div>

            <div className="mb-6">
              <p className="mt-2 text-sm leading-6 text-gray-500">
                သင့်အကောင့်သို့ ဝင်ရောက်ရန် အချက်အလက်များကို ဖြည့်သွင်းပါ။
              </p>
            </div>

            <LoginFormClient />

            <p className="mt-8 text-center text-xs leading-6 text-gray-400">
              © {new Date().getFullYear()} မိတ္ထီလာခရိုင်
              <br />
              တိရစ္ဆာန်ကောင်ရေကောက်ယူရေး စီမံခန့်ခွဲမှုစနစ်
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}