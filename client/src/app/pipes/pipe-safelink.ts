import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl' })
export class SafeUrlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string | null | undefined): SafeResourceUrl | null {
        const v = (value || '').toString().trim();
        if (!v) return null;
        return this.sanitizer.bypassSecurityTrustResourceUrl(v);
    }
}
