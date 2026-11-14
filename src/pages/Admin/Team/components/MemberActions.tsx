import { useState } from "react";
import { KeyRound, MoreHorizontal, UserCog, UserMinus } from "lucide-react";
import type { ClinicMember } from "@/adapters/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ChangeRoleDialog from "./ChangeRoleDialog";
import RemoveMemberDialog from "./RemoveMemberDialog";

type Props = {
  member: ClinicMember;
  clinicName: string;
};

// "⋯" menu on a team member's row: change role, change password, remove.
// The Equipo page only shows it for staff (not the owner, not yourself)
export default function MemberActions({ member, clinicName }: Props) {
  // Which popup is open
  const [dialog, setDialog] = useState<"role" | "password" | "remove" | null>(null);
  const onOpenChange = (open: boolean) => {
    if (!open) setDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={`Acciones para ${member.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
          <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => setDialog("role")}>
            <UserCog /> Cambiar rol
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 rounded-lg" onSelect={() => setDialog("password")}>
            <KeyRound /> Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem
            variant="destructive"
            className="gap-2 rounded-lg"
            onSelect={() => setDialog("remove")}
          >
            <UserMinus /> Eliminar del equipo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog member={member} open={dialog === "role"} onOpenChange={onOpenChange} />
      <ChangePasswordDialog
        member={member}
        open={dialog === "password"}
        onOpenChange={onOpenChange}
      />
      <RemoveMemberDialog
        member={member}
        clinicName={clinicName}
        open={dialog === "remove"}
        onOpenChange={onOpenChange}
      />
    </>
  );
}
