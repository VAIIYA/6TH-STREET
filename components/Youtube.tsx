export function Youtube({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative mt-8 aspect-video overflow-hidden rounded-card border border-white/10 bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
