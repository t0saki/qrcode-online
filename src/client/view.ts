/**
 * A mountable view (mode pane).
 * - `activate` / `deactivate` fire on mode switch (pause/resume resources).
 * - `destroy` fires when the shell is torn down (e.g. locale re-render).
 */
export interface ViewHandle {
  el: HTMLElement;
  activate?(): void;
  deactivate?(): void;
  destroy?(): void;
}
