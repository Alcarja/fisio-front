import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import type { SiteData } from "@/adapters/api";
import { useMe, useSite } from "@/adapters/hook";
import OnboardingWizard from "./components/OnboardingWizard";
import SiteEditor from "./components/SiteEditor";

// Mi web: the clinic's own website, built from our templates (WEBS.md).
// Owners and admins, only in clinics with the "website" feature (router:
// websiteAccess). Backend: /clinic/site (back/src/routes/site.routes.ts).
// Visitors see the published version, served by the sites service
export default function WebsitePage() {
  const { data: me } = useMe();
  const { data, isPending, error } = useSite(me?.activeClinic?.clinicId);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-coral">
          {me?.activeClinic?.clinicName ?? "Clínica"}
        </span>
        <h1 className="font-display text-5xl leading-none tracking-tight md:text-6xl">Mi web</h1>
        <p className="text-muted-foreground">
          Tu web con reserva online, siempre al día con tus servicios, tu equipo y tu horario.
        </p>
      </header>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error.message}
        </div>
      ) : (
        <WebsiteContent data={data} />
      )}
    </div>
  );
}

// Until the site is published for the first time, the step-by-step wizard;
// after that (or if the clinic skips it), the full editor
function WebsiteContent({ data }: { data: SiteData }) {
  const [mode, setMode] = useState<"wizard" | "editor">(() =>
    data.site.publishedAt ? "editor" : "wizard",
  );
  return mode === "wizard" ? (
    <OnboardingWizard data={data} onFinish={() => setMode("editor")} />
  ) : (
    <SiteEditor data={data} />
  );
}
