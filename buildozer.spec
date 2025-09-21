[app]

# (str) Título do aplicativo
title = Sistema de Segurança Escolar

# (str) Nome do pacote
package.name = escolasegura

# (str) Domínio do pacote
package.domain = com.escola.seguranca

# (str) Arquivo principal Python
source.main = main_android_fixed.py

# (str) Diretórios de código fonte (onde estão os arquivos .py)
source.dir = .

# (list) Padrões para incluir (usando regex)
source.include_exts = py,png,jpg,kv,atlas,ttf,json

# (list) Padrões para excluir
source.exclude_exts = spec

# (list) Diretórios/arquivos específicos para excluir
source.exclude_dirs = tests, bin, .buildozer

# (str) Versão do aplicativo
version = 1.1

# (list) Dependências do aplicativo - versões compatíveis com Android 15
requirements = python3,kivy==2.0.0,kivymd==0.104.2,pillow,filelock,requests==2.31.0,python-dateutil==2.8.2,plyer==2.1.0,certifi,charset-normalizer,idna,urllib3

# (str) Arquitetura suportada (pode ser all, armeabi-v7a, arm64-v8a, x86, x86_64)
android.archs = arm64-v8a, armeabi-v7a

# (bool) Indicar se a aplicação será exibida na lista de aplicações
android.skip_update = False

# (str) Ícone do aplicativo (deixar em branco para usar o padrão)
#icon.filename = %(source.dir)s/data/icon.png

# (str) Splash screen
#presplash.filename = %(source.dir)s/data/presplash.png

# (list) Permissões Android
android.permissions = INTERNET,ACCESS_NETWORK_STATE,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,ACCESS_WIFI_STATE,CAMERA,VIBRATE,WAKE_LOCK

# (str) Orientação suportada (portrait, landscape, all)
orientation = portrait

# (bool) Full screen
fullscreen = 0

# (int) API alvo Android
android.api = 31

# (int) API mínima Android
android.minapi = 21

# (bool) Aceitar licenças SDK automaticamente
android.accept_sdk_license = True

# (str) NDK versão para usar
android.ndk = 25b

# (str) Build Tools versão
android.build_tools = 34.0.0

# (list) Dependências Gradle para compatibilidade com Android 14
android.gradle_dependencies = androidx.core:core:1.7.0

# (str) SDK path (deixar em branco para usar o padrão)
#android.sdk_path =

# (str) ANT directory (deixar em branco para usar o padrão)
#android.ant_path =

# (str) Gradle directory (deixar em branco para usar o padrão)  
#android.gradle_path =

# (bool) Se True, então criar um APK de debug ao invés de release
debug = 1

[buildozer]

# (int) Log level (0 = apenas erro, 1 = info, 2 = debug)
log_level = 2

# (int) Display warning se buildozer está executando como root (0 = False, 1 = True)
warn_on_root = 1