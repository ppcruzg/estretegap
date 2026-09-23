import { fireEvent, render, screen } from "@testing-library/react";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Hello">body</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is an accessible modal dialog labelled by its title", () => {
    render(<Modal isOpen onClose={() => {}} title="Hello">body</Modal>);
    const dialog = screen.getByRole("dialog", { name: "Hello" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("body");
  });

  it("closes on Escape and via the labelled close button", () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Hello">body</Modal>);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /cerrar|close/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("renders the footer when provided", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Hello" footer={<button>ok</button>}>
        body
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "ok" })).toBeInTheDocument();
  });
});
