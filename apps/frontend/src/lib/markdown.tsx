import type { ReactNode } from "react";

interface Segment {
  type: "paragraph" | "heading2" | "heading3" | "list" | "code";
  content: string | string[];
  language?: string;
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  return <div className="prose-content">{parseMarkdown(markdown).map(renderSegment)}</div>;
}

function parseMarkdown(markdown: string): Segment[] {
  const lines = markdown.split(/\r?\n/);
  const segments: Segment[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;
  let codeLanguage = "";

  function flushParagraph() {
    if (paragraph.length > 0) {
      segments.push({ type: "paragraph", content: paragraph.join(" ") });
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length > 0) {
      segments.push({ type: "list", content: list });
      list = [];
    }
  }

  for (const line of lines) {
    const codeMatch = line.match(/^```(\w+)?/);
    if (codeMatch) {
      if (code) {
        segments.push({ type: "code", content: code.join("\n"), language: codeLanguage });
        code = null;
        codeLanguage = "";
      } else {
        flushParagraph();
        flushList();
        code = [];
        codeLanguage = codeMatch[1] ?? "";
      }
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      segments.push({ type: "heading2", content: line.slice(3) });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      segments.push({ type: "heading3", content: line.slice(4) });
      continue;
    }

    if (/^- /.test(line)) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return segments;
}

function renderSegment(segment: Segment, index: number): ReactNode {
  if (segment.type === "heading2") return <h2 key={index}>{segment.content}</h2>;
  if (segment.type === "heading3") return <h3 key={index}>{segment.content}</h3>;
  if (segment.type === "list") {
    return (
      <ul key={index}>
        {(segment.content as string[]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (segment.type === "code") {
    return (
      <pre key={index}>
        <code className={segment.language ? `language-${segment.language}` : undefined}>
          {segment.content}
        </code>
      </pre>
    );
  }
  return <p key={index}>{segment.content}</p>;
}
