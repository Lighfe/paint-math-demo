import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "paint-math-frontend" },
      {
        name: "description",
        content: "paint-math-frontend — starter frontend shell, ready to build on.",
      },
      { property: "og:title", content: "paint-math-frontend" },
      {
        property: "og:description",
        content: "paint-math-frontend — starter frontend shell, ready to build on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        ready
      </p>
      <h1 className="font-mono text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        paint-math-frontend
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Empty shell. Nothing built yet — tell me what goes here.
      </p>
    </main>
  );
}
