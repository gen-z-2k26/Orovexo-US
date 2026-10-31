import { cn } from "@/lib/utils";

const DRAW_PATH = 'M-1322.667,78C-1322.667,78,-448,83,-437.333,79.999C-388.482,66.257,-329.333,43,-306,3C-282.667,-37,-252,-163,-283.333,-163C-320.666,-163,-329.327,60.223,-280.667,61C-249.333,61.5,-240.667,-1.487,-222.196,-1.487C-220.667,-1.487,-221.333,-2,-221.333,-2C-221.333,-2,-230.175,2.301,-230.175,1.491C-248.667,16,-246.349,61,-216.667,61C-174,61,-182,-8,-200.667,-8C-218,-8,-210.666,40.5,-177.333,40.5C-150,40.5,-143.333,-8,-119.333,-8C-100,-8,-97.334,0.5,-97.334,0.5C-97.334,0.5,-98.75,-7.875,-118.917,-7.875C-145.588,-7.875,-152.893,34.114,-148,46.5C-142.667,60,-127.197,67.606,-111.333,45C-104.667,35.5,-105.333,20,-105.333,20C-105.333,20,-104.565,36.752,-100,48C-90.667,71,-68.667,55,-61.333,43.5C-55.526,34.392,-37,-7.75,-17.667,-7.75C-17.667,-7.875,-15.5,-7.375,-15.5,-7.375C-15.5,-7.375,-18.917,-7.688,-18.917,-7.625C-21.419,-7.469,-50.167,3.5,-50.167,35C-50.167,50.5,-41.667,58.279,-34.306,58.279C-18,58.279,-9.224,34.585,-8.667,33.75C5.666,12.25,47.334,-144.5,14.667,-144.5C-15.334,-144.5,-15.333,0.5,1.334,33C4.875,39.907,12,57.75,23.333,57.75C37.001,57.75,62.834,36.25,62.834,-17.75C62.834,-34.625,51.334,64,77.667,64C108.334,64,128.333,-13.25,139.333,-13.25C150.333,-13.25,141,56.75,145.333,56.75C149.666,56.75,175,-5,193.667,-5C209,-5,189.667,61,211.333,61C254.333,61,239.667,-6.75,283.667,-6.75C294.667,-6.75,303,2.25,303,2.25C303,2.25,293,-6.75,283.667,-6.75C251,-6.75,233.249,48.758,264.333,58.75C269,60.25,293.667,53.25,293.667,17.25C293.667,3.248,292.667,147.404,292.667,184.5C292.667,212.5,267.016,251.943,253.333,215C246.667,197,260,138,282.667,111.5C300.098,91.122,338.472,23.06,342.333,13.938C343.999,10,1286.671,12,1286.671,12';

export function StoreLoader({
  label = "Loading collection...",
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 text-center text-foreground",
        compact ? "py-6" : "py-12",
        className,
      )}
    >
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-foreground/10">
        <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-foreground" />
      </div>

      <svg
        viewBox="-1380 -190 2720 480"
        aria-hidden="true"
        className={cn(
          "w-full text-foreground",
          compact ? "h-12 max-w-sm" : "h-16 max-w-lg sm:h-20",
        )}
        fill="none"
      >
        <path
          d={DRAW_PATH}
          pathLength="100"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-25"
        />
        <path
          d={DRAW_PATH}
          pathLength="100"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100"
          className="animate-[loader-draw_2.2s_ease-in-out_infinite]"
        />
      </svg>

      {label ? (
        <p className="text-sm tracking-tight text-foreground">{label}</p>
      ) : null}
    </div>
  );
}
