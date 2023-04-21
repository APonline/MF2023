import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscor";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe
  ],
  exports: [
    RemoveUnderscorePipe
  ]
})
export class PipeModule{}
