import Link from "next/link";
import { ArrowRight, Layers, Paintbrush, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden flex flex-col items-center justify-center min-h-[85vh] px-4">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-100/50 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

        <div className="z-10 max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600 mb-4 transition-transform hover:scale-105">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
            The Next-gen Email Builder
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
            Build Stunning Emails <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              at Lightning Speed
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed">
            Drag, drop, and export beautiful, responsive HTML templates. 
            Bring your own Shadcn UI variables. Built by developers, for developers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-orange-500/30 font-semibold gap-2 border-0 text-white rounded-full">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full font-medium border-slate-200 hover:bg-slate-50 transition-colors">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>

        {/* Abstract Browser Mockup */}
        <div className="w-full max-w-6xl mx-auto mt-20 relative z-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="h-12 border-b border-slate-200/60 flex items-center px-4 gap-2 bg-slate-50/50">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="mx-auto bg-white border border-slate-200 rounded-md h-6 w-1/3 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                template-builder.app
              </div>
            </div>
            <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden flex">
              {/* Fake Sidebar */}
              <div className="w-64 h-full border-r border-slate-200 bg-white p-4 space-y-4">
                <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
                <div className="space-y-2">
                  <div className="h-12 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                  <div className="h-12 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                  <div className="h-12 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                </div>
              </div>
              {/* Fake Canvas */}
              <div className="flex-1 h-full p-8 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <div className="w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden border border-slate-200 animate-pulse">
                  <div className="h-32 bg-slate-100 w-full"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
                    <div className="h-10 bg-orange-500 rounded-md w-1/3 mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="w-full py-24 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need to ship faster</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A powerful array of tools specifically engineered into the drag and drop interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-100/50">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Drag & Drop Editor</h3>
              <p className="text-slate-600 leading-relaxed">
                Build complex layouts effortlessly with our intuitive dnd-kit powered editor. No coding required.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all hover:shadow-xl hover:shadow-slate-200/50">
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Paintbrush strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Shadcn Variable Injection</h3>
              <p className="text-slate-600 leading-relaxed">
                Paste your custom Shadcn CSS variables directly into the editor and see your brand come to life instantly.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 hover:border-amber-200 transition-all hover:shadow-xl hover:shadow-amber-100/50">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant HTML Export</h3>
              <p className="text-slate-600 leading-relaxed">
                Powered by React Email, export production-ready, highly compatible HTML code that works in all clients.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg mb-4 md:mb-0">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">MailGen</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} MailGen. The modern email template generator.
          </p>
        </div>
      </footer>
    </div>
  );
}
