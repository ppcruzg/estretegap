import React from "react";
import { cn } from "./cn";
import { iconButtonClasses, type IconButtonVariant } from "./styles";

export type IconButtonProps = Omit<React.ComponentProps<"button">, "variant" | "size"> & {
  /** Required: icon-only buttons have no visible text. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: "sm" | "md";
};

const IconButton = ({
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  title,
  ...props
}: IconButtonProps) => (
  <button
    type={type}
    title={title ?? props["aria-label"]}
    className={cn(iconButtonClasses(variant, size), className)}
    {...props}
  />
);

export default IconButton;
