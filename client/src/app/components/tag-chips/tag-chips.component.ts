// tag-chips.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER, BACKSLASH, SLASH } from '@angular/cdk/keycodes';

export interface Chips { name: string; }

@Component({
  selector: 'app-tag-chips',
  templateUrl: './tag-chips.component.html',
  styleUrls: ['./tag-chips.component.scss']
})
export class TagChipsComponent {
  @Input() local_data = '';
  @Input() chipType = '';
  @Output() Tag = new EventEmitter<string>();

  readonly separatorKeysCodes = [ENTER, COMMA, BACKSLASH, SLASH];
  chips: Chips[] = [];
  addOnBlur = true;
  removable = true;
  placeholder = '';

  ngOnInit() {
    this.placeholder =
      this.chipType === 'Genre'    ? 'Rock, Pop, Metal...' :
      this.chipType === 'Role'     ? 'Vocals, Guitar, Drums...' :
      this.chipType === 'Relation' ? 'Photographer, Promoter, Designer...' :
      'Demos, Promo, Photoset...';

    const src = (this.local_data || '').trim();
    if (src.includes('/')) {
      src.split('/').forEach(s => { const v = s.trim(); if (v) this.chips.push({ name: v }); });
    } else if (src) {
      this.chips.push({ name: src });
    }
    this.update();
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.chips.push({ name: value });
    if (event.input) event.input.value = '';
    this.update();
  }

  remove(c: Chips): void {
    const i = this.chips.indexOf(c);
    if (i >= 0) this.chips.splice(i, 1);
    this.update();
  }

  private update() {
    const out = this.chips.map(c => c.name).join(' / ');
    this.Tag.emit(out);
  }
}
