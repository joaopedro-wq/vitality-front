import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';

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
  const currentUser = signal<User | null>(null);
  const auth = {
    currentUser: currentUser.asReadonly(),
    setCurrentUser: jasmine.createSpy('setCurrentUser'),
  };

  beforeEach(() => {
    currentUser.set(null);
    auth.setCurrentUser.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } },
        { provide: TranslocoService, useValue: { translate: () => 'Erro' } },
      ],
    });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('abre automaticamente apenas para usuário com onboarding pendente', () => {
    service.evaluateUser(user('completed'));
    expect(service.open()).toBeFalse();

    service.evaluateUser(user('pending', 8));
    expect(service.open()).toBeTrue();
    expect(service.step()).toBe(0);
  });

  it('permite reabrir manualmente sem alterar o status persistido', () => {
    service.restart();
    service.next();
    service.dismiss();

    expect(service.open()).toBeFalse();
    http.expectNone(apiPaths.userOnboarding());
  });

  it('persiste a conclusão e atualiza a sessão em memória', () => {
    service.evaluateUser(user('pending'));
    service.finish();

    const request = http.expectOne(apiPaths.userOnboarding());
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'completed' });
    request.flush({ data: user('completed'), success: true });

    expect(auth.setCurrentUser).toHaveBeenCalledWith(user('completed'));
    expect(service.open()).toBeFalse();
  });
});
