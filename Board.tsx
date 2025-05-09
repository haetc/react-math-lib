import { createContext, useRef } from "react";

export const boardContext = createContext<{
  svg: SVGSVGElement | null;
}>({
  svg: null,
});

type BoardOptions = {
  gap: number;
};

const defaultBoardOptions: BoardOptions = {
  gap: 10,
};

type Props = {
  children: React.ReactNode;
  options?: Partial<BoardOptions>;
} & React.SVGProps<SVGSVGElement>;

export default function Board({ children, options, ...props }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const finalOptions = {
    ...defaultBoardOptions,
    ...options,
  };

  return (
    <boardContext.Provider value={{ svg: svgRef.current }}>
      <svg ref={svgRef} {...props}>
        {children}
      </svg>
    </boardContext.Provider>
  );
}
