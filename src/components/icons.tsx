import type { SVGProps } from "react";

export function TasKingLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <g fill="currentColor">
        <path d="M66.6,83.27,128,22,189.4,83.27,172.51,96.16,128,52.3,83.49,96.16Z" />
        <path d="M189.4,172.73,128,234,66.6,172.73,83.49,159.84,128,203.7l44.51-43.86Z" />
        <path d="M22,128l61.27-61.27,12.89,9.92L43.7,128l52.46,51.35-12.89,9.92Z" />
        <path d="M189.4,66.73,176.51,56.81,228,128l-51.49,71.19,12.89-9.92L234.3,128Z" />
      </g>
    </svg>
  );
}
