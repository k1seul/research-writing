import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BookIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </IconBase>
);

export const PenIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </IconBase>
);

export const ChartIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 19V9" />
    <path d="M10 19V5" />
    <path d="M16 19v-7" />
    <path d="M22 19H2" />
  </IconBase>
);

export const UploadIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 16V3" />
    <path d="m7 8 5-5 5 5" />
    <path d="M20 16v4H4v-4" />
  </IconBase>
);

export const ArrowIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </IconBase>
);

export const SparkIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m12 3-1.2 4.1a5 5 0 0 1-3.7 3.7L3 12l4.1 1.2a5 5 0 0 1 3.7 3.7L12 21l1.2-4.1a5 5 0 0 1 3.7-3.7L21 12l-4.1-1.2a5 5 0 0 1-3.7-3.7Z" />
  </IconBase>
);

export const CheckIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m5 12 4 4L19 6" />
  </IconBase>
);

export const AlertIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16.5h.01" />
  </IconBase>
);

export const EyeIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </IconBase>
);

export const MenuIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </IconBase>
);

export const FileIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M6 2h8l4 4v16H6Z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </IconBase>
);

export const CloseIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </IconBase>
);
