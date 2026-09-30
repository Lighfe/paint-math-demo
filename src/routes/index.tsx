import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { sampleDotOffset } from "@/lib/brush";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gaussian Paint Canvas" },
      {
        name: "description",
        content: "Paint with a responsive Gaussian scatter brush and tune its size and spread.",
      },
      { property: "og:title", content: "Gaussian Paint Canvas" },
      {
        property: "og:description",
        content: "Paint with a responsive Gaussian scatter brush and tune its size and spread.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const PAINT_COLOR = "#111111";
const CANVAS_COLOR = "#ffffff";
const MAX_DOTS_PER_MOVE = 480;

type Point = { x: number; y: number };

function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef(5);
  const spreadRef = useRef(10);
  const activePointerRef = useRef<number | null>(null);
  const previousPointRef = useRef<Point | null>(null);
  const [size, setSize] = useState(5);
  const [spread, setSpread] = useState(10);

  const fillCanvasWhite = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = CANVAS_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    fillCanvasWhite();
  }, [fillCanvasWhite]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  const pointFromEvent = useCallback((event: PointerEvent | ReactPointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }, []);

  const drawDots = useCallback((point: Point, count: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const radius = sizeRef.current;
    const currentSpread = spreadRef.current;
    context.fillStyle = PAINT_COLOR;
    context.beginPath();
    for (let index = 0; index < count; index += 1) {
      const { dx, dy } = sampleDotOffset(currentSpread);
      context.moveTo(point.x + dx + radius, point.y + dy);
      context.arc(point.x + dx, point.y + dy, radius, 0, Math.PI * 2);
    }
    context.fill();
  }, []);

  const drawSegment = useCallback(
    (from: Point, to: Point) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      if (distance === 0) return;

      const spacing = Math.max(1, sizeRef.current / 2);
      const dabCount = Math.max(1, Math.ceil(distance / spacing));
      const desiredDotsPerDab =
        spreadRef.current === 0 ? 1 : Math.min(10, Math.max(3, Math.ceil(spreadRef.current / 14)));
      const dotsPerDab = Math.max(1, Math.min(desiredDotsPerDab, Math.floor(MAX_DOTS_PER_MOVE / dabCount)));
      const step = Math.max(1, Math.ceil((dabCount * dotsPerDab) / MAX_DOTS_PER_MOVE));

      for (let index = step; index <= dabCount; index += step) {
        const progress = Math.min(1, index / dabCount);
        drawDots({ x: from.x + dx * progress, y: from.y + dy * progress }, dotsPerDab);
      }
      if (dabCount % step !== 0) drawDots(to, dotsPerDab);
    },
    [drawDots],
  );

  const endStroke = useCallback((pointerId: number) => {
    if (activePointerRef.current !== pointerId) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    activePointerRef.current = null;
    previousPointRef.current = null;
  }, []);

  useEffect(() => {
    const onWindowPointerUp = (event: PointerEvent) => endStroke(event.pointerId);
    const onWindowPointerCancel = (event: PointerEvent) => endStroke(event.pointerId);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerCancel);
    return () => {
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerCancel);
    };
  }, [endStroke]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || activePointerRef.current !== null) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    previousPointRef.current = point;
    drawDots(point, 12);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      endStroke(event.pointerId);
      return;
    }
    const point = pointFromEvent(event);
    const previousPoint = previousPointRef.current;
    if (!point || !previousPoint) return;
    drawSegment(previousPoint, point);
    previousPointRef.current = point;
  };

  const handleSizeChange = (values: number[]) => {
    const nextSize = values[0];
    if (nextSize === undefined) return;
    sizeRef.current = nextSize;
    setSize(nextSize);
  };

  const handleSpreadChange = (values: number[]) => {
    const nextSpread = values[0];
    if (nextSpread === undefined) return;
    spreadRef.current = nextSpread;
    setSpread(nextSpread);
  };

  return (
    <main className="flex min-h-screen w-full flex-col overflow-x-hidden bg-muted/40 p-3 sm:p-5">
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3">
        <header className="grid w-full grid-cols-1 items-end gap-4 rounded-md border bg-background p-4 shadow-sm sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto]">
          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <Label id="size-label">Size</Label>
              <output className="shrink-0 text-sm tabular-nums text-muted-foreground">{size} px</output>
            </div>
            <Slider
              aria-labelledby="size-label"
              value={[size]}
              min={1}
              max={50}
              step={1}
              onValueChange={handleSizeChange}
            />
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <Label id="spread-label">Spread</Label>
              <output className="shrink-0 text-sm tabular-nums text-muted-foreground">{spread} px</output>
            </div>
            <Slider
              aria-labelledby="spread-label"
              value={[spread]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleSpreadChange}
            />
          </div>

          <Button type="button" variant="outline" className="min-h-11" onClick={fillCanvasWhite}>
            Clear
          </Button>
        </header>

        <div className="min-h-[340px] flex-1 overflow-hidden rounded-md border bg-background shadow-sm sm:min-h-[500px]">
          <canvas
            ref={canvasRef}
            aria-label="Paint canvas"
            className="block min-h-[340px] w-full touch-none cursor-crosshair sm:min-h-[500px] sm:h-full"
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => endStroke(event.pointerId)}
            onPointerCancel={(event) => endStroke(event.pointerId)}
          />
        </div>
      </div>
    </main>
  );
}
