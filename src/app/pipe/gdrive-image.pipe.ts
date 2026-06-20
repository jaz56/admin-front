import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'gdriveImage', standalone: true })
export class GdriveImagePipe implements PipeTransform {
  transform(url: string | null | undefined): string {
  if (!url) return 'assets/images/profile/user-1.jpg';

  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    // thumbnail au lieu de uc?export=view
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
  }

  return url;
}
}