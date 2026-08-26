import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { BdTourService } from 'bandeira-ui';
import { Subject, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { apiPaths } from '../http/api-paths';
import type { User } from '../models/user.model';
import { OnboardingService } from './onboarding.service';

const user = (status: User['onboarding_status'], id = 7): User => ({
  id,
  name: 'Pessoa Teste',
  email: 'teste@example.test',
  data_nascimento: null,
  genero: null,
  peso: null,
  altura: null,
  avatar: null,
  nivel_atividade: null,
  objetivo: null,
  is_admin: false,
  onboarding_status: status,
  onboarding_finished_at: null,
});

describe('OnboardingService', () => {
  let service: OnboardingService;
  let http: HttpTestingController;
  let tourTarget: HTMLElement;
  const currentUser = signal<User | null>(null);
  const auth = {
    currentUser: currentUser.asReadonly(),
    setCurrentUser: jasmine.createSpy('setCurrentUser'),
  };
  const tourActive = signal(false);
  const tourOutcome = signal<{ completed: boolean; step: number } | null>(null);
  const tourStep = signal<{ target: string } | null>(null);
  const tour = {
    active: tourActive.asReadonly(),
    outcome: tourOutcome.asReadonly(),
    step: tourStep.asReadonly(),
    start: jasmine.createSpy('start').and.callFake(() => tourActive.set(true)),
  };
  const routerEvents = new Subject<NavigationEnd>();
  const router = {
    events: routerEvents.asObservable(),
    url: '/dashboard',
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
  };
  let translationsLoaded = true;
  const transloco = {
    translate: jasmine.createSpy('translate').and.callFake((key: string) => key),
    getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('en-US'),
    load: jasmine.createSpy('load').and.callFake(() => {
      translationsLoaded = true;
      return of({});
    }),
  };

  beforeEach(() => {
    currentUser.set(null);
    auth.setCurrentUser.calls.reset();
    tourActive.set(false);
    tourOutcome.set(null);
    tourStep.set(null);
    tour.start.calls.reset();
    router.navigateByUrl.calls.reset();
    router.url = '/dashboard';
    translationsLoaded = true;
    transloco.translate.calls.reset();
    transloco.getActiveLang.calls.reset();
    transloco.load.calls.reset();
    transloco.translate.and.callFake((key: string) => key);
    transloco.load.and.callFake(() => {
      translationsLoaded = true;
      return of({});
    });
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: BdTourService, useValue: tour },
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } },
        { provide: TranslocoService, useValue: transloco },
      ],
    });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
    tourTarget = document.createElement('div');
    tourTarget.dataset['tour'] = 'onboarding-dashboard-desktop';
    spyOn(tourTarget, 'getBoundingClientRect').and.returnValue({
      width: 44,
      height: 44,
    } as DOMRect);
    document.body.append(tourTarget);
  });

  afterEach(() => {
    tourTarget.remove();
    localStorage.clear();
    http.verify();
  });

  it('abre as boas-vindas apenas para usuário com onboarding pendente', fakeAsync(() => {
    service.evaluateUser(user('completed'));
    tick();
    expect(service.welcomeOpen()).toBeFalse();

    service.evaluateUser(user('pending', 8));
    tick();
    expect(service.welcomeOpen()).toBeTrue();
    expect(tour.start).not.toHaveBeenCalled();

    service.beginIntroduction();
    tick(80);
    TestBed.flushEffects();
    expect(tour.start).toHaveBeenCalled();
    expect(tour.start).toHaveBeenCalledWith(
      [jasmine.objectContaining({ target: '[data-tour="onboarding-dashboard-desktop"]' })],
      jasmine.any(Object),
    );
  }));

  it('permite reabrir manualmente sem alterar o status persistido', fakeAsync(() => {
    service.restart();
    expect(service.welcomeOpen()).toBeTrue();
    service.beginIntroduction();
    tick();
    tourActive.set(false);
    tourOutcome.set({ completed: false, step: 0 });
    tick();

    http.expectNone(apiPaths.userOnboarding());
  }));

  it('persiste o pulo e atualiza a sessão em memória', fakeAsync(() => {
    service.evaluateUser(user('pending'));
    service.dismissWelcome();
    tick();

    const request = http.expectOne(apiPaths.userOnboarding());
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'skipped' });
    request.flush({ data: user('skipped'), success: true });

    expect(auth.setCurrentUser).toHaveBeenCalledWith(user('skipped'));
  }));

  it('mostra a dica da tela uma vez e a guarda neste dispositivo', fakeAsync(() => {
    service.evaluateUser(user('completed'));
    tourTarget.dataset['tour'] = 'onboarding-diary-map';
    router.url = '/diario';
    routerEvents.next(new NavigationEnd(1, '/diario', '/diario'));
    tick(80);
    TestBed.flushEffects();

    expect(tour.start).toHaveBeenCalledWith(
      [jasmine.objectContaining({ target: '[data-tour="onboarding-diary-map"]' })],
      jasmine.any(Object),
    );

    tourActive.set(false);
    tourOutcome.set({ completed: true, step: 0 });
    tick();
    TestBed.flushEffects();

    expect(localStorage.getItem('vitality:onboarding:page-hints:v1:7')).toContain('"diary":true');

    tour.start.calls.reset();
    routerEvents.next(new NavigationEnd(2, '/dashboard', '/dashboard'));
    routerEvents.next(new NavigationEnd(3, '/diario', '/diario'));
    tick(80);
    TestBed.flushEffects();

    expect(tour.start).not.toHaveBeenCalled();
  }));

  it('espera a tradução ativa antes de abrir a dica do Diário', fakeAsync(() => {
    translationsLoaded = false;
    transloco.translate.and.callFake((key: string) => {
      if (!translationsLoaded) return key;
      return (
        {
          'onboarding.diaryMap.title': 'Choose a moment in your day',
          'onboarding.diaryMap.description': 'The map organizes meals by time.',
        }[key] ?? key
      );
    });

    service.evaluateUser(user('completed'));
    tourTarget.dataset['tour'] = 'onboarding-diary-map';
    router.url = '/diario';
    routerEvents.next(new NavigationEnd(1, '/diario', '/diario'));
    tick(80);
    TestBed.flushEffects();

    const [steps] = tour.start.calls.mostRecent().args;
    expect(steps[0].title).toBe('Choose a moment in your day');
    expect(steps[0].content).toBe('The map organizes meals by time.');
  }));
});
