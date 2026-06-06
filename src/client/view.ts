/** A mountable view (mode pane). `activate`/`deactivate` fire on mode switch. */
export interface ViewHandle {
  el: HTMLElement;
  activate?(): void;
  deactivate?(): void;
}
