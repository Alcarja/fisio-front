import { SITE_LIMITS } from "../siteFormat";
import { FieldGroup, type ContentProps } from "./Field";
import ImageSlot from "./ImageSlot";

// The cover photo and the gallery. Optional: templates look fine without them
export default function PhotosFields({ content, onChange }: ContentProps) {
  const gallery = content.galleryIds;
  const full = gallery.length >= SITE_LIMITS.gallery;

  return (
    <>
      <FieldGroup
        title="Foto de portada"
        description="La primera imagen de tu web. Horizontal y de buena calidad: tu clínica, tu equipo o un tratamiento."
      >
        <ImageSlot
          kind="cover"
          imageId={content.coverId}
          label="Subir foto de portada"
          className="aspect-[16/9] w-full max-w-xl"
          onChange={(id) => onChange({ ...content, coverId: id }, { save: true })}
        />
      </FieldGroup>

      <FieldGroup
        title="Galería"
        description={`Hasta ${SITE_LIMITS.gallery} fotos de tus instalaciones. Sin pacientes reconocibles salvo que tengas su permiso por escrito.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.map((id) => (
            <ImageSlot
              key={id}
              kind="gallery"
              imageId={id}
              label="Foto"
              className="aspect-square"
              onChange={() =>
                onChange({ ...content, galleryIds: gallery.filter((g) => g !== id) }, { save: true })
              }
            />
          ))}
          {!full && (
            <ImageSlot
              kind="gallery"
              imageId={undefined}
              label="Añadir foto"
              className="aspect-square"
              onChange={(id) =>
                id && onChange({ ...content, galleryIds: [...gallery, id] }, { save: true })
              }
            />
          )}
        </div>
      </FieldGroup>
    </>
  );
}
