import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { boardContext } from "./Board";

export type PointOptions = {
  fill?: string;
  radius?: number;
  draggable?: "x" | "y" | "both" | "none";
  snapToGrid?: boolean;
};

type Props = {
  x: number;
  y: number;
  onDrag?: (x: number, y: number) => void;
  options?: Partial<PointOptions>;
  // Apparently the SVG element already has an onDrag prop, so we gotta omit that
} & Omit<React.SVGProps<SVGCircleElement>, "onDrag">;

export default function Point({ x, y, onDrag, options, ...props }: Props) {
  const {
    svg,
    worldToScreen,
    screenToWorld,
    screenToWorldLength,
    setIsDraggingSomething,
  } = useContext(boardContext);
  const circleRef = useRef<SVGCircleElement>(null);

  const {
    fill = "black",
    radius = 5,
    draggable = "both",
    snapToGrid = false,
  } = options ?? {};

  // Define a hitbox radius to make the point easier to drag
  const hitboxRadius = Math.max(radius + 10, 10);
  const SNAP_THRESHOLD = 0.2;

  // Live coords are handled in world coordinates
  const [liveCoords, setLiveCoords] = useState({ x, y });
  const liveCoordsRef = useRef(liveCoords); // Ref to access latest liveCoords in event handlers
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null); // Ref for drag offset

  useEffect(() => {
    liveCoordsRef.current = liveCoords;
  }, [liveCoords]);

  useEffect(() => {
    setLiveCoords({ x, y });
  }, [x, y]);

  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (event: React.MouseEvent<SVGCircleElement>) => {
    event.stopPropagation();
    const worldClickPos = screenToWorld(event.clientX, event.clientY);
    dragOffsetRef.current = {
      x: liveCoordsRef.current.x - worldClickPos.x,
      y: liveCoordsRef.current.y - worldClickPos.y,
    };
    setIsDragging(true);
    setIsDraggingSomething(true);
    svg?.style.setProperty("cursor", "grabbing");
  };

  const handleTouchStart = (event: React.TouchEvent<SVGCircleElement>) => {
    if (draggable === "none" || event.touches.length !== 1) return;
    event.stopPropagation(); // Prevent board panning
    event.preventDefault(); // Prevent page scrolling/zooming during drag
    const touch = event.touches[0];
    const worldTouchPos = screenToWorld(touch.clientX, touch.clientY);
    dragOffsetRef.current = {
      x: liveCoordsRef.current.x - worldTouchPos.x,
      y: liveCoordsRef.current.y - worldTouchPos.y,
    };
    setIsDragging(true);
    setIsDraggingSomething(true);
    svg?.style.setProperty("cursor", "grabbing");
  };

  useEffect(() => {
    const processPointerMove = (
      pointerClientX: number,
      pointerClientY: number
    ) => {
      if (!isDragging || !dragOffsetRef.current) return;

      const worldPointer = screenToWorld(pointerClientX, pointerClientY);

      let intendedX = worldPointer.x + dragOffsetRef.current.x;
      let intendedY = worldPointer.y + dragOffsetRef.current.y;

      let finalTargetX, finalTargetY;

      if (draggable === "both") {
        finalTargetX = intendedX;
        finalTargetY = intendedY;
      } else if (draggable === "x") {
        finalTargetX = intendedX;
        finalTargetY = liveCoordsRef.current.y; // Keep current Y
      } else if (draggable === "y") {
        finalTargetX = liveCoordsRef.current.x; // Keep current X
        finalTargetY = intendedY;
      } else {
        return; // Should not happen
      }

      setLiveCoords(() => {
        let finalX = finalTargetX;
        let finalY = finalTargetY;

        if (snapToGrid) {
          const roundedX = Math.round(finalTargetX);
          const roundedY = Math.round(finalTargetY);
          if (
            Math.abs(finalTargetX - roundedX) < SNAP_THRESHOLD &&
            Math.abs(finalTargetY - roundedY) < SNAP_THRESHOLD
          ) {
            finalX = roundedX;
            finalY = roundedY;
          }
        }
        onDrag?.(finalX, finalY);
        return { x: finalX, y: finalY };
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      processPointerMove(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsDraggingSomething(false);
        svg?.style.setProperty("cursor", "unset");
        dragOffsetRef.current = null;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length === 1) {
        event.preventDefault();
        const touch = event.touches[0];
        processPointerMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isDragging) {
        if (event.touches.length === 0) {
          setIsDragging(false);
          setIsDraggingSomething(false);
          svg?.style.setProperty("cursor", "unset");
          dragOffsetRef.current = null;
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
  }, [isDragging, screenToWorld, draggable, snapToGrid, onDrag, svg]);

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
        {...props}
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
