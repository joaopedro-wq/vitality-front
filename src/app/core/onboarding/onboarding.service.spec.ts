import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { BdTourService } from 'bandeira-ui';
import { Subject } from 'rxjs';

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

  beforeEach(() => {
    currentUser.set(null);
    auth.setCurrentUser.calls.reset();
    tourActive.set(false);
    tourOutcome.set(null);
    tourStep.set(null);
    tour.start.calls.reset();
    router.navigateByUrl.calls.reset();
    router.url = '/dashboard';
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
        { provide: TranslocoService, useValue: { translate: () => 'Erro' } },
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
    tick();
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
    tick();

    expect(tour.start).toHaveBeenCalledWith(
      [jasmine.objectContaining({ target: '[data-tour="onboarding-diary-map"]' })],
      jasmine.any(Object),
    );

    tourActive.set(false);
    tourOutcome.set({ completed: true, step: 0 });
    tick();

    expect(localStorage.getItem('vitality:onboarding:page-hints:v1:7')).toContain('"diary":true');

    tour.start.calls.reset();
    routerEvents.next(new NavigationEnd(2, '/dashboard', '/dashboard'));
    routerEvents.next(new NavigationEnd(3, '/diario', '/diario'));
    tick();

    expect(tour.start).not.toHaveBeenCalled();
  }));
});
