import { useContext } from "react";
import { boardContext } from "./Board";

export type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function Overlay({ children, className, style }: Props) {
  const { isDraggingSomething } = useContext(boardContext);

  return (
    <div
      className={`${className} ${
        isDraggingSomething
          ? "[&_*]:pointer-events-none"
          : "[&_*]:pointer-events-auto"
      }`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Debug */}
      {/* <span className="text-red-500">
        {isDraggingSomething ? "Dragging" : "Not dragging"}
      </span> */}
      {children}
    </div>
  );
}
