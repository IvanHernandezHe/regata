import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'danger';
export interface Toast { id: number; text: string; type: ToastType; durationMs: number; actionLabel?: string; onAction?: () => void; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  #seq = 1;
  #toasts = signal<Toast[]>([]);
  readonly toasts = this.#toasts.asReadonly();

  show(text: string, type: ToastType = 'info', durationMs = 3000, actionLabel?: string, onAction?: () => void) {
    const id = this.#seq++;
    const toast: Toast = { id, text, type, durationMs, actionLabel, onAction };
    this.#toasts.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
  showWithAction(text: string, actionLabel: string, onAction: () => void, type: ToastType = 'info', durationMs = 5000) {
    this.show(text, type, durationMs, actionLabel, onAction);
  }
  success(text: string, durationMs = 2500) { this.show(text, 'success', durationMs); }
  info(text: string, durationMs = 2500) { this.show(text, 'info', durationMs); }
  warning(text: string, durationMs = 2500) { this.show(text, 'warning', durationMs); }
  danger(text: string, durationMs = 2500) { this.show(text, 'danger', durationMs); }

  dismiss(id: number) {
    this.#toasts.update(list => list.filter(t => t.id !== id));
  }
}
