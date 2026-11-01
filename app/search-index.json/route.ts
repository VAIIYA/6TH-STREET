import { getAllArticles } from "@/lib/content";

export function GET() {
  return Response.json(
    getAllArticles().map((a) => ({
      title: a.title,
      summary: a.summary,
      href: a.href,
      category: a.category,
    })),
  );
}
