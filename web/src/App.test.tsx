// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

beforeAll(() => {
  // jsdom has no <dialog> implementation; mirror the browser contract the app relies on.
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) { this.removeAttribute("open"); };
});

describe("App on the built bundle", () => {
  it("renders the vendor matrix, opens a cell to bullets and quotes, and adds a bullet to the brief", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ITSM buying decisions");
    expect(screen.getByText(/They do not measure vendor market share/)).toBeTruthy();
    expect(screen.getByLabelText("Explore evidence by topic")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Cases" })).toBeTruthy();
    const view = document.querySelectorAll('main button[aria-haspopup="dialog"]');
    if (view.length) {
      fireEvent.click(view[0]);
      const caseDialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
      expect(within(caseDialog).getAllByText(/^(Unreviewed|Reviewed|Analyst-edited)$/).length).toBeGreaterThan(0);
      fireEvent.click(within(caseDialog).getByRole("button", { name: "Close panel" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Compare vendors" }));
    const table = document.querySelector<HTMLTableElement>("main table")!;
    expect(within(table).getByText("Footprint in these interviews")).toBeTruthy();
    expect(within(table).getByText("Pricing and TCO")).toBeTruthy();
    const cells = [...document.querySelectorAll<HTMLButtonElement>('main button[aria-haspopup="dialog"]')].filter((b) => !b.disabled);
    if (cells.length === 0) return; // an empty store still renders the frame
    fireEvent.click(cells[0]);
    const dialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(within(dialog).getByText("Findings to review")).toBeTruthy();
    expect(within(dialog).getAllByText(/^(Unreviewed|Reviewed|Analyst-edited)$/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/speaking about/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/^E[1-9]\d*:P\d{3}/).length).toBeGreaterThan(0);
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Add to brief" })[0]);
    expect(screen.getByRole("button", { name: "Brief (analyst draft) · 1" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close panel" }));
    expect(document.querySelector("dialog[open]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Brief (analyst draft) · 1" }));
    const brief = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(within(brief).getByRole("button", { name: "Copy Markdown" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(within(brief).getByRole("button", { name: "Close panel" }));
    fireEvent.click(screen.getByRole("button", { name: "Methods" }));
    expect(within(document.querySelector("dialog[open]")!).getByText("Source versions")).toBeTruthy();
  });
});
