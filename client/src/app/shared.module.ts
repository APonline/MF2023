import { NgModule } from "@angular/core";
import { AngularMaterialModule } from './angular-material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { PipeModule } from "./pipes/pipe.module";



@NgModule({
  declarations: [

  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterModule,
    PipeModule
  ],
  exports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterModule,
    PipeModule
  ]
})
export class SharedModule {}
