import { useRef } from "react";
import { generatePath } from "react-router";
import { Copy, Download, ExternalLink } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paths } from "@/routes/paths";
import SettingsSection from "../../components/SettingsSection";

type Props = {
  slug: string;
  clinicName: string;
  // The clinic's switch: when off, the link answers "no online bookings"
  bookingEnabled: boolean;
};

// The clinic's public booking page: its link, and the same link as a QR to
// print (reception, shop window, appointment cards)
export default function BookingLinkSection({ slug, clinicName, bookingEnabled }: Props) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const url = `${window.location.origin}${generatePath(paths.publicBooking, { slug })}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace", { description: "Cópialo a mano desde el campo." });
    }
  };

  const download = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-reservas-${slug}.png`;
    link.click();
  };

  return (
    <SettingsSection
      title="Enlace y QR"
      description="La página donde reservan tus pacientes. Comparte el enlace (web, WhatsApp, Google) o imprime el QR para la recepción."
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* White frame: a QR needs a light margin to be read, also in dark mode */}
        <div className="w-fit shrink-0 rounded-2xl border bg-white p-3">
          <QRCodeCanvas
            ref={qrRef}
            value={url}
            // Drawn large so the downloaded image prints well; shown small
            size={1024}
            marginSize={2}
            level="M"
            style={{ width: "9rem", height: "9rem" }}
            aria-label={`QR de reservas de ${clinicName}`}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Input
            readOnly
            value={url}
            aria-label="Enlace de reservas"
            onFocus={(e) => e.target.select()}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={copy}>
              <Copy /> Copiar enlace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={download}
            >
              <Download /> Descargar QR
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink /> Abrir página
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {bookingEnabled
              ? "El enlace y el QR no cambian: puedes imprimirlo con tranquilidad."
              : "La reserva online está desactivada: quien abra el enlace verá que la clínica no acepta reservas online."}
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}
