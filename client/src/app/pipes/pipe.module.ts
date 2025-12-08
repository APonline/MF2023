import { NgModule } from "@angular/core";
import { RemoveUnderscorePipe } from "./pipe-remove-underscore";
import { CapitalizePipe } from "./pipe-uppercase-words";
import { SanitizeHtmlPipe } from "./pipe-sanitize-html";
import { SafePipe } from "./pipe-safeurl";
import { KeysPipe } from "./pipe-keyvalue";
import { SafeHtmlPipe } from "./pipe-safeHtml";
import { GalleryFilterPipe } from "./pipe-gallery-filter";


@NgModule({
  imports: [],
  declarations: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe,
    GalleryFilterPipe
  ],
  exports: [
    RemoveUnderscorePipe,
    CapitalizePipe,
    SanitizeHtmlPipe,
    SafePipe,
    KeysPipe,
    SafeHtmlPipe,
    GalleryFilterPipe
  ]
})
export class PipeModule{}
