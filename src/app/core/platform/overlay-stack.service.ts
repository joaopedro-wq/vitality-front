import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OverlayStackService {
  private readonly camadas: Array<() => void> = [];

  registrar(fechar: () => void): () => void {
    this.camadas.push(fechar);

    return () => {
      const indice = this.camadas.lastIndexOf(fechar);
      if (indice >= 0) this.camadas.splice(indice, 1);
    };
  }

  fecharTopo(): boolean {
    const fechar = this.camadas.pop();
    if (!fechar) return false;

    fechar();

    return true;
  }
}
