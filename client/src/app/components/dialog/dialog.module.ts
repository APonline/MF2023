import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/angular-material.module';
import { NewItemUpdateComponent } from '../new-item-update/new-item-update.component';
import { DialogTemplate } from './templates/dialog.component';
import { UploadFilesComponent } from '../upload-multi/upload-multi.component';
import { UploadFileComponent } from '../upload-single/upload-single.component';

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
  declarations: [
    DialogTemplate,
    NewItemUpdateComponent,
    UploadFilesComponent,
    UploadFileComponent
  ],
  imports:[
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ],
  exports: [
    DialogTemplate,
    NewItemUpdateComponent,
    UploadFilesComponent,
    UploadFileComponent
  ],
  entryComponents: [
    DialogTemplate,
    NewItemUpdateComponent,
    UploadFilesComponent,
    UploadFileComponent
  ]
})
export class DialogModule { }
