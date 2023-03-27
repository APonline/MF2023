import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { NewItemUpdateComponent } from '../new-item-update/new-item-update.component';
import { DialogTemplate } from './templates/dialog.component';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [
    DialogTemplate,
    NewItemUpdateComponent
  ],
  imports:[
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DialogTemplate,
    NewItemUpdateComponent
  ],
  entryComponents: [
    DialogTemplate,
    NewItemUpdateComponent
  ]
})
export class DialogModule { }
