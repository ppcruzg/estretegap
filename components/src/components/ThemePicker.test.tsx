import { fireEvent, render, screen } from "@testing-library/react";
import ThemePicker from "./ThemePicker";
import { ThemeProvider } from "../contexts/ThemeContext";

const setup = () =>
  render(
    <ThemeProvider>
      <div>
        <ThemePicker />
        <button type="button">outside</button>
      </div>
    </ThemeProvider>,
  );

const trigger = () => screen.getByRole("button", { name: "Apariencia" });

describe("ThemePicker", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("app-language", "es");
    document.documentElement.className = "";
  });

  it("is closed by default and exposes its state", () => {
    setup();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a panel with five translated palette swatches", () => {
    setup();
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual([
      "Océano", "Esmeralda", "Violeta", "Ámbar", "Grafito",
    ]);
    expect(screen.getByRole("radio", { name: "Océano" })).toHaveAttribute("aria-checked", "true");
  });

  it("selects a palette", () => {
    setup();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("radio", { name: "Violeta" }));
    expect(document.documentElement.dataset.theme).toBe("violet");
    expect(screen.getByRole("radio", { name: "Violeta" })).toHaveAttribute("aria-checked", "true");
  });

  it("toggles dark mode", () => {
    setup();
    fireEvent.click(trigger());
    const toggle = screen.getByRole("switch", { name: "Modo oscuro" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", () => {
    setup();
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("closes on outside click", () => {
    setup();
    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open when clicking inside the panel", () => {
    setup();
    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole("radio", { name: "Ámbar" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
