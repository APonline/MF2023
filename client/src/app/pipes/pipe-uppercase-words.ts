import { Pipe, PipeTransform  } from '@angular/core';

@Pipe({ name: 'capitalizeWord' })
export class CapitalizePipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (!value) return value;
    return value[0].toUpperCase() + value.substr(1).toLowerCase();
  }
}
