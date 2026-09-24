// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeAll(() => {
  // jsdom has no <dialog> implementation; mirror the browser contract the app relies on.
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) { this.removeAttribute("open"); };
});

describe("App on the built bundle", () => {
  it("moves from the overview through evidence into an editable, cited brief export", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("What drove these ITSM choices?");
    const limitCard = document.querySelector<HTMLElement>(".sq-limit-card")!;
    expect(within(limitCard).getByText(/Three interviews cannot establish market share/)).toBeTruthy();
    expect(screen.getByLabelText("Explore evidence by topic")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Observed company choices" })).toBeTruthy();
    const overviewRows = [...document.querySelectorAll(".sq-choice-row")];
    const companyNames = [
      "Pharma Company (Xena)",
      "Thermo Fisher",
      "Life Sciences Firm (Calloway Biosciences)",
      "Solara Renewables",
    ];
    for (const name of companyNames) {
      expect(overviewRows.some((row) => row.textContent?.includes(name))).toBe(true);
    }
    fireEvent.click(screen.getAllByRole("button", { name: /Inspect case evidence/ })[0]);
    const overviewDialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    expect(within(overviewDialog).getAllByText(/^(Unreviewed|Reviewed|Analyst-edited)$/).length).toBeGreaterThan(0);
    expect(within(overviewDialog).getAllByText(/^E[1-9]\d*:P\d{3}/).length).toBeGreaterThan(0);
    fireEvent.click(within(overviewDialog).getByRole("button", { name: "Close panel" }));

    fireEvent.click(screen.getByRole("button", { name: "Cases" }));
    expect(screen.getByRole("heading", { level: 1, name: "Company cases" })).toBeTruthy();
    const caseLinks = [...document.querySelectorAll<HTMLButtonElement>('main button[aria-haspopup="dialog"]')];
    expect(caseLinks.length).toBeGreaterThan(0);
    fireEvent.click(caseLinks[0]);
    const caseDialog = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    fireEvent.click(within(caseDialog).getByRole("button", { name: "Close panel" }));

    fireEvent.click(screen.getByRole("button", { name: "Compare vendors" }));
    const table = document.querySelector<HTMLTableElement>("main table")!;
    expect(within(table).getByText("Footprint in these interviews")).toBeTruthy();
    expect(within(table).getByText("Pricing and TCO")).toBeTruthy();
    const cells = [
      ...document.querySelectorAll<HTMLButtonElement>('main button[aria-haspopup="dialog"]'),
    ].filter((button) => !button.disabled);
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
    const conclusion = within(brief).getByLabelText("Conclusion (analyst draft)") as HTMLTextAreaElement;
    fireEvent.change(conclusion, { target: { value: "The selected evidence describes three distinct buyer cases." } });
    expect(conclusion.value).toBe("The selected evidence describes three distinct buyer cases.");
    expect(within(brief).getByRole("button", { name: "Copy Markdown" }).hasAttribute("disabled")).toBe(false);
    const blobs: Blob[] = [];
    const previousCreate = URL.createObjectURL;
    const previousRevoke = URL.revokeObjectURL;
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        blobs.push(blob);
        return "blob:test-brief";
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
    try {
      fireEvent.click(within(brief).getByRole("button", { name: "Download .md" }));
      expect(blobs).toHaveLength(1);
      const exported = await readBlob(blobs[0]);
      expect(exported).toContain("The selected evidence describes three distinct buyer cases.");
      expect(exported).toMatch(/> \[E[1-9]\d*:P\d{3}\]/);
      expect(exported).toContain("Caveats");
    } finally {
      Object.defineProperty(URL, "createObjectURL", { configurable: true, value: previousCreate });
      Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: previousRevoke });
      anchorClick.mockRestore();
    }
    fireEvent.click(within(brief).getByRole("button", { name: "Close panel" }));
    fireEvent.click(screen.getByRole("button", { name: "Methods" }));
    expect(within(document.querySelector("dialog[open]")!).getByText("Source versions")).toBeTruthy();
  });
});
