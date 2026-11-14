import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-5 pt-24 text-center md:pt-32">
      <span className="font-display text-[10rem] leading-none tracking-tight text-muted-foreground/30 md:text-[14rem]">
        404
      </span>
      <h1 className="-mt-6 font-display text-5xl tracking-tight md:-mt-10">
        Esta página se ha hecho un <em className="text-coral">esguince</em>.
      </h1>
      <p className="mt-4 text-muted-foreground">
        La página que buscas no existe o se ha movido.
      </p>
      <Button size="lg" className="mt-8 h-12 rounded-full px-6" asChild>
        <Link to={paths.home}>
          <ArrowLeft /> Volver al inicio
        </Link>
      </Button>
    </section>
  );
}
