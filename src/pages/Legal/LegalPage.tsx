import type { ReactNode } from "react";
import { legalEntity } from "@/lib/legal";

type Props = {
  title: ReactNode;
  // One or two sentences under the title: what the page is, in plain words
  intro: string;
  children: ReactNode;
};

// The shell of the legal pages (privacy, legal notice, cookies): the public
// site's heading style on top and a narrow column of text below
export default function LegalPage({ title, intro, children }: Props) {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-16 md:pt-24">
      <span className="text-sm font-medium text-coral">Legal</span>
      <h1 className="mt-6 font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl">
        {title}
      </h1>
      <p className="mt-6 text-lg text-pretty text-muted-foreground">{intro}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Última actualización: {legalEntity.updated}
      </p>
      <div className="mt-12 flex flex-col gap-12 border-t pt-12">{children}</div>
    </article>
  );
}

// One titled block of a legal page. `id` lets other pages link straight to it
export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-4">
      <h2 className="font-display text-3xl tracking-tight">{title}</h2>
      <div className="flex flex-col gap-4 leading-relaxed text-pretty text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </section>
  );
}
