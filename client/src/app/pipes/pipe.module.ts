import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";
import { SafePipe } from "./pipe-safeurl";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe
  ]
})
export class PipeModule{}
