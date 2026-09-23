import React from "react";
import { cn } from "./cn";
import { CARD_ELEVATION, cardClasses } from "./styles";

export type CardProps = Omit<React.ComponentProps<"div">, "padded" | "elevation"> & {
  /** Adds the standard inner padding (p-6). Disable to set your own. */
  padded?: boolean;
  elevation?: keyof typeof CARD_ELEVATION;
};

const Card = ({ padded = true, elevation = "card", className, ...props }: CardProps) => (
  <div className={cn(cardClasses, CARD_ELEVATION[elevation], padded && "p-6", className)} {...props} />
);

export default Card;
