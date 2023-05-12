import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe
  ]
})
export class PipeModule{}
