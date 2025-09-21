# Instruções de Debug para Android 15

Para diagnosticar por que o APK não abre no seu A14 5G com Android 15:

## 1. Habilitar USB Debugging
1. Vá em **Configurações > Sobre o telefone**
2. Toque 7 vezes em "Número da versão" para habilitar opções de desenvolvedor
3. Volte para **Configurações > Opções do desenvolvedor**
4. Ative **"Depuração USB"**

## 2. Conectar ao Computador e Ver Logs
```bash
# Conecte o celular via USB
adb devices

# Ver logs específicos do Python/Kivy
adb logcat -s python

# Ou ver todos os logs relacionados ao app
adb logcat | grep escolasegura
```

## 3. Reinstalar o APK Via ADB
```bash
# Desinstalar versão atual
adb uninstall com.escola.seguranca.escolasegura

# Instalar nova versão
adb install bin/escolasegura-1.0-arm64-v8a-debug.apk

# Tentar abrir e ver logs imediatamente
adb logcat -s python
```

## 4. Verificar Logs Internos no Dispositivo
Após tentar abrir o app, verifique se existem logs em:
- `/sdcard/Android/data/com.escola.seguranca.escolasegura/files/.kivy/logs/`
- `/sdcard/org.testapp/.kivy/logs/` (local alternativo)

## 5. Versões Aplicadas para Android 15
- Kivy: 2.0.0 (versão estável testada)
- KivyMD: 0.104.2 (sem problemas de GPU Adreno)
- Pillow: adicionado (resolve 90% dos crashes)
- API: 31 (compatível com Android 15)

## 6. Se Ainda Não Funcionar
Execute o comando de debug e me envie a saída completa:
```bash
adb logcat -s python > debug_log.txt
```

O arquivo `debug_log.txt` mostrará exatamente qual erro está causando o crash.