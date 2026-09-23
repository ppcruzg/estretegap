import { render, screen } from "@testing-library/react";
import { Button, Card, IconButton, Input } from ".";

describe("UI primitives", () => {
  it("Button defaults to type=button, primary tokens and a focus-visible ring", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("focus-visible:ring-2");
  });

  it.each([
    ["secondary", "bg-surface"],
    ["ghost", "hover:bg-surface-muted"],
    ["danger", "bg-danger"],
  ] as const)("Button %s variant uses tokens", (variant, cls) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole("button").className).toContain(cls);
  });

  it("Button keeps an explicit submit type", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("IconButton is named by its aria-label and mirrors it as title", () => {
    render(<IconButton aria-label="Delete">×</IconButton>);
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn).toHaveAttribute("title", "Delete");
  });

  it("Input forwards props and uses token classes", () => {
    render(<Input aria-label="Email" placeholder="a@b.c" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.className).toContain("border-border");
    expect(input.className).toContain("focus-visible:ring-2");
  });

  it("Card renders a token surface", () => {
    render(<Card data-testid="card">content</Card>);
    expect(screen.getByTestId("card").className).toContain("rounded-card");
  });

  it("uses no hardcoded palette classes", () => {
    const { container } = render(
      <>
        <Button>a</Button>
        <Button variant="secondary">b</Button>
        <Button variant="ghost">c</Button>
        <Button variant="danger">d</Button>
        <IconButton aria-label="e" variant="danger">e</IconButton>
        <Input aria-label="f" />
        <Card>g</Card>
      </>,
    );
    expect(container.innerHTML).not.toMatch(/(slate|blue|gray|zinc|red)-\d{2,3}/);
  });
});
