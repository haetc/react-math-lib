"use client";
import katex, { type KatexOptions } from "katex";

export default function InlineMath({
  latex,
  options,
  ...props
}: {
  latex: string;
  options?: KatexOptions;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const html = katex.renderToString(latex, options);

  return <span dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
