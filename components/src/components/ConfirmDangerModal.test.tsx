import { fireEvent, render, screen } from "@testing-library/react";
import ConfirmDangerModal from "./ConfirmDangerModal";

const setup = (open = true) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmDangerModal
      open={open}
      title="Delete page"
      description="This cannot be undone."
      confirmText="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { ...utils, onConfirm, onCancel };
};

describe("ConfirmDangerModal", () => {
  it("renders nothing when closed", () => {
    const { container } = setup(false);
    expect(container).toBeEmptyDOMElement();
  });

  it("is an accessible alert dialog labelled by its title", () => {
    setup();
    expect(screen.getByRole("alertdialog", { name: "Delete page" })).toHaveAttribute("aria-modal", "true");
  });

  it("keeps confirm/cancel handlers and cancels on Escape", () => {
    const { onConfirm, onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses theme tokens instead of hardcoded palette classes", () => {
    const { container } = setup();
    expect(document.body.innerHTML).not.toMatch(/(slate|gray|red|white|black)-\d{2,3}|bg-white|bg-black/);
    expect(container.ownerDocument.querySelector(".bg-overlay")).not.toBeNull();
  });
});
