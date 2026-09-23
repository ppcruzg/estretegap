import React from "react";
import { cn } from "./cn";
import { inputClasses } from "./styles";

export type InputProps = React.ComponentProps<"input">;

const Input = ({ className, ...props }: InputProps) => (
  <input className={cn(inputClasses, className)} {...props} />
);

export default Input;
