import { useState } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SiteTeamInput, SiteTeamMember } from "@/adapters/api";
import { useMe, useSiteTeam, useUpdateSiteTeamMember } from "@/adapters/hook";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clinicRoleLabels } from "@/lib/roles";
import Field from "./Field";
import ImageSlot from "./ImageSlot";

// Mi web → Equipo: one card per professional (receptionists don't appear).
// Saved per person and live on the website at once, not part of the draft
export default function TeamEditor() {
  const { data: me } = useMe();
  const { data: team, isPending, error } = useSiteTeam(me?.activeClinic?.clinicId);

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Elige quién aparece en tu web y cómo. Los cambios del equipo se ven en tu web en cuanto
        los guardas, sin publicar. Pide permiso a cada profesional antes de mostrar su foto.
      </p>
      {team.map((member) => (
        // key with the saved data: the form starts again from it after saving
        <MemberCard key={`${member.memberId}-${JSON.stringify(member)}`} member={member} />
      ))}
    </div>
  );
}

const toForm = (m: SiteTeamMember): SiteTeamInput => ({
  visible: m.visible,
  displayName: m.displayName,
  headline: m.headline,
  bio: m.bio,
  licenseNumber: m.licenseNumber,
  photoId: m.photoId,
  sortOrder: m.sortOrder,
});

function MemberCard({ member }: { member: SiteTeamMember }) {
  const [form, setForm] = useState(() => toForm(member));
  const update = useUpdateSiteTeamMember();
  const set = (patch: Partial<SiteTeamInput>) => setForm((f) => ({ ...f, ...patch }));
  const changed = JSON.stringify(form) !== JSON.stringify(toForm(member));
  const id = `team-${member.memberId}`;

  const save = (data: SiteTeamInput) =>
    update.mutate(
      { memberId: member.memberId, data },
      {
        onSuccess: () => toast.success("Guardado", { description: data.displayName || member.name }),
        onError: (error) => toast.error("No se pudo guardar", { description: error.message }),
      },
    );

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-medium">{member.name}</span>
          <span className="text-xs text-muted-foreground">{clinicRoleLabels[member.role]}</span>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${id}-visible`}
            checked={form.visible}
            onCheckedChange={(v) => set({ visible: v === true })}
          />
          <Label htmlFor={`${id}-visible`}>Mostrar en la web</Label>
        </div>
      </div>

      {form.visible && (
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <ImageSlot
            kind="team"
            imageId={form.photoId}
            label="Foto"
            className="aspect-square w-32"
            // A new photo is saved with the rest of the card at once
            onChange={(photoId) => {
              const next = { ...form, photoId: photoId ?? null };
              setForm(next);
              save(next);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre en la web"
              value={form.displayName ?? ""}
              max={80}
              placeholder={member.name}
              onChange={(v) => set({ displayName: v || null })}
            />
            <Field
              label="Especialidad"
              value={form.headline ?? ""}
              max={120}
              placeholder="Fisioterapeuta · Suelo pélvico"
              onChange={(v) => set({ headline: v || null })}
            />
            <Field
              label="Nº de colegiado"
              value={form.licenseNumber ?? ""}
              max={40}
              hint="Recomendado: la publicidad sanitaria suele exigirlo."
              onChange={(v) => set({ licenseNumber: v || null })}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-order`}>Orden</Label>
              <Input
                id={`${id}-order`}
                type="number"
                min={0}
                max={999}
                value={form.sortOrder}
                onChange={(e) => set({ sortOrder: Math.max(0, Math.min(999, Number(e.target.value) || 0)) })}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Los números más bajos salen primero.</p>
            </div>
            <Field
              className="sm:col-span-2"
              label="Presentación"
              value={form.bio ?? ""}
              max={1500}
              multiline
              rows={4}
              onChange={(v) => set({ bio: v || null })}
            />
          </div>
        </div>
      )}

      {changed && (
        <Button
          type="button"
          className="w-fit self-end rounded-full"
          disabled={update.isPending}
          onClick={() => save(form)}
        >
          {update.isPending && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      )}
    </section>
  );
}
