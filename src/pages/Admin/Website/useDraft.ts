import { useState } from "react";
import { toast } from "sonner";
import type { SiteContent, SiteData } from "@/adapters/api";
import { useSaveSiteDraft } from "@/adapters/hook";
import { sameContent } from "./siteFormat";

// The draft being edited in the wizard or the editor: kept here until saved.
// After each save it starts again from what the server stored (cleaned up)
export function useDraft(data: SiteData) {
  const [content, setContent] = useState<SiteContent>(data.site.draft);
  const [template, setTemplate] = useState(data.site.template);
  const saveDraft = useSaveSiteDraft();

  const dirty = !sameContent(content, data.site.draft) || template !== data.site.template;

  const save = async (nextContent = content, nextTemplate = template) => {
    const saved = await saveDraft.mutateAsync({ content: nextContent, template: nextTemplate });
    setContent(saved.site.draft);
    setTemplate(saved.site.template);
    return saved;
  };

  // For the field blocks. `save`: an image changed, store it right away
  const onChange = (next: SiteContent, options?: { save?: boolean }) => {
    setContent(next);
    if (options?.save) {
      save(next).catch((error: Error) =>
        toast.error("No se pudo guardar", { description: error.message }),
      );
    }
  };

  return { content, template, setTemplate, dirty, save, saving: saveDraft.isPending, onChange };
}
