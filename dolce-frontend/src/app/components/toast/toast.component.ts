import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toast',
  imports:[CommonModule, FormsModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  standalone: true
})
export class ToastComponent {
  @Input() message: string = '';
  show = false;

  trigger(message: string): void {
    this.message = message;
    this.show = true;

    setTimeout(() => {
      this.show = false;
    }, 3000);
  }
}
