import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ToastService } from '../../../core/toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [NgFor, NgIf],
  styles: [`
    .toast-wrap { position: fixed; right: 16px; bottom: 16px; z-index: 1080; display: flex; flex-direction: column; gap: .5rem; }
    .toast-item { min-width: 220px; max-width: 360px; }
  `],
  template: `
    <div class="toast-wrap">
      <div *ngFor="let t of toasts()" class="alert toast-item mb-0" [class.alert-success]="t.type==='success'" [class.alert-info]="t.type==='info'" [class.alert-warning]="t.type==='warning'" [class.alert-danger]="t.type==='danger'">
        <div class="d-flex align-items-center justify-content-between gap-3">
          <div class="me-2">{{ t.text }}</div>
          <div class="d-flex align-items-center gap-2">
            <button *ngIf="t.actionLabel" class="btn btn-sm btn-outline-light" (click)="onAction(t.id)">{{ t.actionLabel }}</button>
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="dismiss(t.id)"></button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  #svc = inject(ToastService);
  toasts = this.#svc.toasts;
  dismiss(id: number) { this.#svc.dismiss(id); }
  onAction(id: number) {
    const t = this.toasts().find(x => x.id === id);
    try { t?.onAction?.(); } finally { this.dismiss(id); }
  }
}
