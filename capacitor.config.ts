import type { CapacitorConfig } from '@capacitor/cli';

/** Mesmo fundo do `theme-color` do index.html e do splash "Prato Servindo". */
const FUNDO = '#171410';

const config: CapacitorConfig = {
  appId: 'com.vitalityplus.app',
  appName: 'Vitality PLUS',
  // Saída do `ng build` (angular.json usa @angular/build:application, que emite em browser/).
  webDir: 'dist/vitality-front/browser',
  android: {
    // Evita flash branco entre a splash nativa e o primeiro paint do WebView. O
    // recorte de notch/gesture bar continua por conta do CSS, que já usa
    // env(safe-area-inset-*) na barra inferior do app-shell.
    backgroundColor: FUNDO,
  },
  plugins: {
    SplashScreen: {
      // O index.html tem o próprio splash (o prato animado), que só some quando
      // o Angular cria o componente raiz. Deixar a splash nativa cair sozinha
      // abriria uma janela de tela vazia entre as duas — quem baixa é o
      // NativeShellService, depois do bootstrap.
      launchAutoHide: false,
      backgroundColor: FUNDO,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,
      splashImmersive: false,
    },
    Keyboard: {
      // Redimensiona o WebView ao abrir o teclado, para os campos numéricos dos
      // quizzes (Metas, Perfil, composer do Diário) não ficarem cobertos.
      resize: 'native',
    },
  },
};

export default config;
