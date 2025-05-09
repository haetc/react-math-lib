import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { boardContext } from "./Board";

type PointOptions = {
  fill?: string;
  radius?: number;
  draggable?: boolean;
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

  const { fill = "black", radius = 5, draggable = true } = options ?? {};

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
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        // Transform the movement vector to world coordinates
        const movementX = screenToWorldLength(event.movementX);
        const movementY = -screenToWorldLength(event.movementY);

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
      setIsDragging(false);
      svg?.style.setProperty("cursor", "unset");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, screenToWorld]);

  // Conversion to screen coords for rendering
  const screenCoords = worldToScreen(liveCoords.x, liveCoords.y);

  return (
    <circle
      cx={screenCoords.x}
      cy={screenCoords.y}
      r={radius}
      fill={fill}
      ref={circleRef}
      onMouseDown={draggable ? handleMouseDown : undefined}
      style={{
        cursor: isDragging ? "unset" : draggable ? "grab" : "default",
      }}
    />
  );
}
