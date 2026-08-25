import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageService } from '../../../core/i18n/language.service';
import { PageTitleComponent } from './page-title.component';

describe('PageTitleComponent', () => {
  let fixture: ComponentFixture<PageTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageTitleComponent],
      providers: [
        { provide: LanguageService, useValue: { locale: signal('pt-BR').asReadonly() } },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) =>
              ({
                'pageTitle.dashboard': 'Dashboard',
                'pageTitle.library': 'Biblioteca',
                'pageTitle.foods': 'Alimentos',
              })[key] ?? key,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PageTitleComponent);
  });

  it('renderiza contexto, título e subtítulo', () => {
    fixture.componentRef.setInput('contexto', 'Biblioteca');
    fixture.componentRef.setInput('titulo', 'Alimentos');
    fixture.componentRef.setInput('subtitulo', 'Encontre os itens do catálogo.');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Alimentos');
    expect(element.textContent).toContain('Biblioteca');
    expect(element.textContent).toContain('Encontre os itens do catálogo.');
  });

  it('mantém o subtítulo opcional', () => {
    fixture.componentRef.setInput('titulo', 'Dashboard');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Dashboard');
    expect(element.querySelectorAll('p')).toHaveSize(0);
  });
});
