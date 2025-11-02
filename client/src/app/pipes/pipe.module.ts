import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";
import { SafePipe } from "./pipe-safeurl";
import { KeysPipe } from "./pipe-keyvalue";
import { SafeHtmlPipe } from "./pipe-safeHtml";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe
  ]
})
export class PipeModule{}
