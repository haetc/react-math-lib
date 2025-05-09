import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { boardContext } from "./Board";

type PointOptions = {
  fill?: string;
  radius?: number;
  draggable?: boolean;
};

const defaultPointOptions: PointOptions = {
  fill: "black",
  radius: 5,
  draggable: true,
};

type Props = {
  x: number;
  y: number;
  onDrag?: (x: number, y: number) => void;
  options?: Partial<PointOptions>;
};

export default function Point({ x, y, onDrag, options }: Props) {
  const { svg, worldToScreen, screenToWorld } = useContext(boardContext);
  const circleRef = useRef<SVGCircleElement>(null);

  // Live coords are handled in screen (SVG) coordinates
  const [liveCoords, setLiveCoords] = useState(worldToScreen(x, y));
  useEffect(() => {
    setLiveCoords(worldToScreen(x, y));
  }, [x, y, worldToScreen]);

  // Merge default options with provided options
  const finalOptions = {
    ...defaultPointOptions,
    ...options,
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (event: React.MouseEvent<SVGCircleElement>) => {
    setIsDragging(true);
    svg?.style.setProperty("cursor", "grabbing");
  };
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        setLiveCoords((prev) => {
          const newCoords = {
            x: prev.x + event.movementX,
            y: prev.y + event.movementY,
          };
          const worldCoords = screenToWorld(newCoords.x, newCoords.y);
          onDrag?.(worldCoords.x, worldCoords.y);
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
  }, [isDragging]);

  return (
    <circle
      cx={liveCoords.x}
      cy={liveCoords.y}
      r={finalOptions.radius}
      fill={finalOptions.fill}
      ref={circleRef}
      onMouseDown={finalOptions.draggable ? handleMouseDown : undefined}
      style={{
        cursor: isDragging
          ? "unset"
          : finalOptions.draggable
          ? "grab"
          : "default",
      }}
    />
  );
}
