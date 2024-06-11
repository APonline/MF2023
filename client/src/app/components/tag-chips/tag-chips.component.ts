import {BACKSLASH, SLASH, COMMA, ENTER} from '@angular/cdk/keycodes';
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';

export interface Chips {
  name: string;
}

@Component({
  selector: 'app-tag-chips',
  templateUrl: 'tag-chips.component.html',
  styleUrls: ['./tag-chips.component.scss']
})

export class TagChipsComponent implements OnInit {
  @Output() Tag = new EventEmitter<any>();
  @Input() local_data: any;
  @Input() chipType: string;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, BACKSLASH, SLASH];
  chips: Chips[] = [];
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  modUser=false;
  selectedGenres= '';
  placeholder='';

  constructor() {
  }

  ngOnInit() {
    if(this.chipType == 'Genre'){
      this.placeholder='Rock, Pop, Metal...';
    }else if(this.chipType == 'Role'){
      this.placeholder='Vocals, Guitar, Drums...';
    }else if(this.chipType == 'Relation'){
      this.placeholder='Photographer, Promoter, Designer...';
    }

    if(this.local_data.indexOf('/') !== -1){
      let chipies = this.local_data.split('/');
      chipies.map(c => {
        if ((c || "").trim()) {
          this.chips.push({ name: c.trim() });
        }
      });
    }else{
      if ((this.local_data || "").trim()) {
        this.chips.push({ name: this.local_data.trim() });
      }
    }

    this.update();

  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || "").trim()) {
      this.chips.push({ name: value.trim() });
    }

    if (input) {
      input.value = "";
    }
    this.update();
  }

  remove(c: Chips): void {
    const index = this.chips.indexOf(c);

    if (index >= 0) {
      this.chips.splice(index, 1);
    }
    this.update();
  }

  update() {
    let newChipList = '';
    this.chips.map(res => {
      newChipList = newChipList + res.name + ' / ';
    });

    newChipList = newChipList.slice(0, -3);
    this.selectedGenres = newChipList;
    this.Tag.emit(this.selectedGenres);
  }
}
