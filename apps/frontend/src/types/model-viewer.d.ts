declare namespace React.JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      "camera-controls"?: boolean | string;
      "auto-rotate"?: boolean | string;
      "shadow-intensity"?: string;
      "touch-action"?: string;
      "interaction-prompt"?: string;
    };
  }
}
