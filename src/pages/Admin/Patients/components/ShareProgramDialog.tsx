import { generatePath } from "react-router";
import { Copy, ExternalLink, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paths } from "@/routes/paths";

// How the patient gets their exercises: a QR to scan before leaving the
// consulta, the link to send, or the page printed
export default function ShareProgramDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const url = `${window.location.origin}${generatePath(paths.publicExercises, { token })}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ejercicios para el paciente</DialogTitle>
          <DialogDescription>
            Que lo escanee con la cámara del móvil antes de irse. Es el mismo enlace aunque cambies los ejercicios o
            pases a una nueva fase. Solo muestra los ejercicios, nunca su diagnóstico, y deja de funcionar al
            finalizarlos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-2xl border bg-white p-6">
          <QRCodeSVG value={url} size={200} marginSize={0} />
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs break-all text-muted-foreground">{url}</p>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" className="rounded-full" onClick={copy}>
            <Copy /> Copiar enlace
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-full" asChild>
              <a href={`${url}?imprimir=1`} target="_blank" rel="noreferrer">
                <Printer /> Imprimir
              </a>
            </Button>
            <Button type="button" className="rounded-full" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink /> Abrir
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
