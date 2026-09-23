import React from "react";
import { cn } from "./cn";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./styles";

export type ButtonProps = Omit<React.ComponentProps<"button">, "variant" | "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = ({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) => <button type={type} className={cn(buttonClasses(variant, size), className)} {...props} />;

export default Button;
