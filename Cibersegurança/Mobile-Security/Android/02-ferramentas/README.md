# Ferramentas Android

## Visão Geral

| Ferramenta | Tipo | Nível de Atuação |
|---|---|---|
| [Magisk](./Magisk.md) | Root / Módulos | Userspace (init) |
| [KernelSU](./KernelSU.md) | Root | Kernel (nível 0) |
| [RootAVD](./RootAVD.md) | Root de emulador | Userspace + kernel |
| [Frida](./Frida.md) | Instrumentação dinâmica | Userspace (processo) |
| [Objection](./Objection.md) | Shell sobre Frida | Userspace |
| [JADX](./JADX.md) | Análise estática | Off-device |
| [MobSF](./MobSF.md) | Framework completo | Off-device + on-device |

## Quando usar cada uma

```
Análise sem dispositivo →  JADX, MobSF (estático)
Análise em runtime      →  Frida, Objection
Root no dispositivo     →  Magisk (flexível) | KernelSU (furtivo)
Root no emulador        →  RootAVD
Framework completo      →  MobSF (estático + dinâmico)
```
