import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe
  ]
})
export class PipeModule{}
