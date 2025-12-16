import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";
import { SafePipe } from "./pipe-safeurl";
import { KeysPipe } from "./pipe-keyvalue";
import { SafeHtmlPipe } from "./pipe-safeHtml";
import { GalleryFilterPipe } from "./pipe-gallery-filter";
import { SafeUrlPipe } from "./pipe-safelink";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe,
    GalleryFilterPipe,
    SafeUrlPipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe,
    GalleryFilterPipe,
    SafeUrlPipe
  ]
})
export class PipeModule{}
