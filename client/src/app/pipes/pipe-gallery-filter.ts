// quick pipe (in its own file normally, putting inline here for clarity)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'galleryFilter' })
export class GalleryFilterPipe implements PipeTransform {
    transform(items: any[], search: string): any[] {
        if (!items || !search) return items;
        const t = search.toLowerCase();
        return items.filter(g =>
            (g.title || '').toLowerCase().includes(t) ||
            (g.description || '').toLowerCase().includes(t) ||
            (g.tags || '').toLowerCase().includes(t) ||
            (g.genre || '').toLowerCase().includes(t)
        );
    }
}
