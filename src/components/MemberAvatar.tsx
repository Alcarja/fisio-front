import type { ClinicMember } from "@/adapters/api";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default function MemberAvatar({
  member,
}: {
  member: Pick<ClinicMember, "name" | "image">;
}) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium">
      {member.image ? (
        <img src={member.image} alt="" className="size-full object-cover" />
      ) : (
        initials(member.name)
      )}
    </span>
  );
}
