import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";
import { SafePipe } from "./pipe-safeurl";
import { KeysPipe } from "./pipe-keyvalue";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe
  ]
})
export class PipeModule{}
