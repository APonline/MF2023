import { NgModule } from "@angular/core";
import { AngularMaterialModule } from './angular-material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";



@NgModule({
  declarations: [

  ],
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    RouterModule,
  ]
})
export class SharedModule {}
