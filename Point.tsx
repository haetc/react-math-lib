import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { boardContext } from "./Board";

export type PointOptions = {
  fill?: string;
  radius?: number;
  draggable?: "x" | "y" | "both" | "none";
};

type Props = {
  x: number;
  y: number;
  onDrag?: (x: number, y: number) => void;
  options?: Partial<PointOptions>;
};

export default function Point({ x, y, onDrag, options }: Props) {
  const { svg, worldToScreen, screenToWorld, screenToWorldLength } =
    useContext(boardContext);
  const circleRef = useRef<SVGCircleElement>(null);

  const { fill = "black", radius = 5, draggable = "both" } = options ?? {};

  // Define a hitbox radius to make the point easier to drag
  const hitboxRadius = Math.max(radius + 10, 10);

  // Live coords are handled in world coordinates
  const [liveCoords, setLiveCoords] = useState({ x, y });
  useEffect(() => {
    setLiveCoords({ x, y });
  }, [x, y]);

  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (event: React.MouseEvent<SVGCircleElement>) => {
    event.stopPropagation();
    setIsDragging(true);
    svg?.style.setProperty("cursor", "grabbing");
  };

  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (event: React.TouchEvent<SVGCircleElement>) => {
    if (draggable === "none" || event.touches.length !== 1) return;
    event.stopPropagation(); // Prevent board panning
    event.preventDefault(); // Prevent page scrolling/zooming during drag
    setIsDragging(true);
    lastTouchRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
    svg?.style.setProperty("cursor", "grabbing");
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        // Transform the movement vector to world coordinates
        const movementX =
          draggable === "both" || draggable === "x"
            ? screenToWorldLength(event.movementX)
            : 0;
        const movementY =
          draggable === "both" || draggable === "y"
            ? -screenToWorldLength(event.movementY)
            : 0;

        setLiveCoords((prev) => {
          const newCoords = {
            x: prev.x + movementX,
            y: prev.y + movementY,
          };
          onDrag?.(newCoords.x, newCoords.y);
          return newCoords;
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        svg?.style.setProperty("cursor", "unset");
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length === 1 && lastTouchRef.current) {
        event.preventDefault();
        const touch = event.touches[0];
        const movementX =
          draggable === "both" || draggable === "x"
            ? screenToWorldLength(touch.clientX - lastTouchRef.current.x)
            : 0;
        const movementY =
          draggable === "both" || draggable === "y"
            ? -screenToWorldLength(touch.clientY - lastTouchRef.current.y)
            : 0;

        setLiveCoords((prev) => {
          const newCoords = {
            x: prev.x + movementX,
            y: prev.y + movementY,
          };
          onDrag?.(newCoords.x, newCoords.y);
          return newCoords;
        });
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isDragging) {
        if (event.touches.length === 0) {
          setIsDragging(false);
          svg?.style.setProperty("cursor", "unset");
          lastTouchRef.current = null;
          event.preventDefault();
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, screenToWorldLength, onDrag, svg, draggable]); // Added screenToWorldLength, onDrag, svg, draggable to deps

  // Conversion to screen coords for rendering
  const screenCoords = worldToScreen(liveCoords.x, liveCoords.y);

  return (
    <g>
      {/* This is the visual circle */}
      <circle
        cx={screenCoords.x}
        cy={screenCoords.y}
        r={radius}
        fill={fill}
        ref={circleRef}
      />
      {draggable !== "none" && (
        // The invisible circle on top of the visual circle
        // This is the actual circle that handles the events
        <circle
          cx={screenCoords.x}
          cy={screenCoords.y}
          r={hitboxRadius}
          fill="transparent"
          stroke="transparent"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            cursor: isDragging ? "unset" : "grab",
          }}
        />
      )}
    </g>
  );
}
