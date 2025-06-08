"use client";
import katex from "katex";

export default function InlineMath({
  latex,
  ...props
}: { latex: string } & React.HTMLAttributes<HTMLSpanElement>) {
  const html = katex.renderToString(latex);

  return <span dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
