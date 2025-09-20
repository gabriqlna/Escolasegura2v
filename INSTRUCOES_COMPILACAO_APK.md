# Sistema de Segurança Escolar - Instruções para Compilar APK

Este documento fornece instruções detalhadas para compilar o aplicativo Python + Kivy em um arquivo APK para Android.

## Pré-requisitos

### 1. Sistema Linux (Ubuntu/Debian recomendado)
O Buildozer funciona melhor em sistemas Linux. Para Windows, use WSL2.

⚠️ **IMPORTANTE**: O Buildozer não funciona em ambientes restritos como Replit, GitHub Codespaces, etc. devido a limitações de PTRACE. Use uma máquina Linux local ou uma VM para compilação.

### 2. Instalar Dependências do Sistema
```bash
sudo apt update
sudo apt install -y git zip unzip openjdk-11-jdk python3-pip autoconf libtool pkg-config zlib1g-dev libncurses5-dev libncursesw5-dev libtinfo5 cmake libffi-dev libssl-dev
```

### 3. Instalar Buildozer
```bash
pip3 install --user buildozer
```

### 4. Instalar Cython
```bash
pip3 install --user cython==0.29.33
```

## Configuração do Firebase (APENAS para versão Desktop)

⚠️ **IMPORTANTE**: A versão Android (main_android.py) usa dados locais e NÃO precisa de configuração Firebase.

Para a versão desktop (main.py) com Firebase:

### 1. Crie o arquivo `.env` na raiz do projeto:
```bash
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_APP_ID=seu-app-id  
FIREBASE_API_KEY=sua-api-key
```

### 2. Adicione o arquivo `google-services.json` na pasta do projeto
- Baixe do Console Firebase > Configurações do Projeto > Seus apps
- Coloque na raiz do projeto

**Para Android**: Pule esta seção - não é necessária!

## Compilação do APK

### 1. Clone/baixe o projeto
```bash
git clone <seu-repositorio>
cd sistema-seguranca-escolar
```

### 2. Inicializar o buildozer (apenas primeira vez se buildozer.spec não existir)
```bash
buildozer init
```

### 3. Compilar o APK
```bash
buildozer android debug
```

**Nota**: O buildozer usa as dependências definidas em `buildozer.spec`, não em `pyproject.toml`.

O processo pode demorar 30-60 minutos na primeira execução, pois baixa todas as dependências.

### 4. APK será gerado em:
```
bin/escolasegura-1.0-arm64-v8a-debug.apk
```

## Instalação no Dispositivo Android

### 1. Habilitar "Instalação de fontes desconhecidas" no Android
- Vá em Configurações > Segurança > Fontes desconhecidas

### 2. Transferir o APK para o dispositivo
```bash
adb install bin/escolasegura-1.0-arm64-v8a-debug.apk
```

Ou copie manualmente o arquivo APK para o dispositivo e instale.

## Correções Aplicadas

✅ **Dependências corrigidas**: Removidas libs problemáticas do Firebase
✅ **App Android otimizado**: Criado main_android.py para compilação móvel
✅ **Configuração buildozer.spec atualizada**: Dependências compatíveis com Android

## Solução de Problemas Comuns

### 1. Erro de Java/SDK
```bash
# Instalar OpenJDK 11
sudo apt install openjdk-11-jdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

### 2. Erro de NDK/SDK
```bash
# Limpar e recriar
buildozer android clean
rm -rf .buildozer
buildozer android debug
```

### 3. Erro de permissões
```bash
chmod +x buildozer
```

### 4. Erro de dependências Python
```bash
# Instalar dependências localmente (apenas as compatíveis com Android)
pip3 install kivy kivymd pillow plyer requests python-dateutil
```

### 5. Erro de espaço em disco
- O processo precisa de pelo menos 10GB livres
- Limpe o cache: `rm -rf ~/.buildozer`

### 6. Erro PTRACE (ptrace::getregs: ESRCH)
❌ **Este erro NÃO pode ser corrigido em ambientes restritos** como:
- Replit, GitHub Codespaces, Docker containers
- Windows WSL com restrições de segurança
- Ambientes virtualizados sem privilégios

✅ **Solução obrigatória**: Compilar em máquina Linux física:
```bash
# Use Ubuntu 20.04+ ou Debian 11+ com:
# - Python 3.9+
# - OpenJDK 11
# - Android SDK/NDK configurados manualmente
# - Pelo menos 10GB de espaço livre
```

**Ambiente testado recomendado:**
- Ubuntu 22.04 LTS
- Python 3.11
- OpenJDK 11
- 16GB RAM (mínimo 8GB)

## Customizações

### Alterar ícone do app
1. Crie um ícone 512x512 em PNG
2. Salve como `icon.png` na raiz do projeto
3. Descomente a linha no `buildozer.spec`:
```ini
icon.filename = %(source.dir)s/icon.png
```

### Alterar splash screen
1. Crie uma imagem 1280x720 em PNG
2. Salve como `presplash.png` na raiz do projeto  
3. Descomente a linha no `buildozer.spec`:
```ini
presplash.filename = %(source.dir)s/presplash.png
```

### Compilar APK de produção (release)
```bash
buildozer android release
```

O APK de release precisa ser assinado digitalmente para publicação.

## Estrutura de Arquivos

### Para compilação Android:
```
sistema-seguranca-escolar/
├── main_android.py        # Aplicativo principal (Android)
├── buildozer.spec         # Configuração do buildozer
├── icon.png              # Ícone do app (opcional)
├── presplash.png         # Splash screen (opcional)
└── bin/                  # APKs compilados
```

### Para versão desktop (com Firebase):
```
sistema-seguranca-escolar/
├── main.py               # Aplicativo principal (Desktop)
├── .env                  # Variáveis de ambiente (não versionar)
├── google-services.json  # Config Firebase (não versionar)  
└── [outros arquivos...]
```

## Funcionalidades do App

### Versão Android (main_android.py)
✅ **Sistema de Login/Cadastro** - Dados locais (sem Firebase)
✅ **Controle de Permissões** - Por tipo de usuário
✅ **Denúncias** - Anônimas ou identificadas
✅ **Avisos** - Lista de avisos da escola
✅ **Controle de Visitantes** - Registro entrada/saída
✅ **Botão de Emergência** - Alerta rápido
✅ **Interface Otimizada** - Para dispositivos móveis

### Versão Completa (main.py - apenas para desktop)
✅ **Todas as funcionalidades Android** +
✅ **Firebase Auth** - Autenticação online
✅ **Push Notifications** - Avisos em tempo real
✅ **Campanhas Educativas** - Gerenciamento avançado
✅ **Painel de Vigilância** - Simulação de câmeras
✅ **Relatórios Avançados** - Analytics e estatísticas

## Tipos de Usuário e Permissões

### 👨‍🎓 Aluno
- Fazer denúncias
- Ver avisos
- Usar botão de emergência
- Consultar campanhas educativas
- Ver plano de evacuação
- Ver calendário de simulados

### 👨‍🏫 Funcionário  
- Tudo do aluno +
- Registrar visitantes
- Adicionar ocorrências no diário
- Atualizar checklist de segurança

### 👨‍💼 Direção
- Tudo dos outros +
- Criar avisos urgentes
- Ver todas as denúncias  
- Cadastrar campanhas educativas
- Banir/desbanir usuários
- Gerar relatórios
- Agendar simulados

## Suporte

Para problemas técnicos:
1. Verifique os logs: `buildozer android debug -v`
2. Consulte a documentação oficial do Buildozer
3. Limpe o cache e recompile se necessário

## Próximos Passos

- Implementar notificações push reais
- Adicionar streaming de câmeras real  
- Criar dashboard web administrativo
- Implementar backup automático dos dados
- Adicionar relatórios em PDF