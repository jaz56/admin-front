import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'gdriveImage', standalone: true })
export class GdriveImagePipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) return 'assets/images/profile/user-1.jpg';

    // Convertit les liens Google Drive /file/d/ID/view → lien direct
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }

    return url;
  }
}